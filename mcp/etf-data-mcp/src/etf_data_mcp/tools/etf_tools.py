"""Tools voor etf-data-mcp."""
from ..schemas import SearchETFsInput, GetETFDetailsInput, CompareETFsInput, FilterForBeginnerInput, GetTop3ForProfileInputV2
from ..data import ETF_CATALOG, ETF_BY_ISIN, ETFRecord
from ..scoring import compute_all_scores, score_beginner_fit


def _etf_summary(etf: dict) -> dict:
    return {
        "isin": etf["isin"],
        "ticker": etf["ticker"],
        "name": etf["name"],
        "issuer": etf["issuer"],
        "expense_ratio": etf["expense_ratio"],
        "asset_class": etf["asset_class"],
        "region_focus": etf["region_focus"],
        "distribution_type": etf["distribution_type"],
        "index_tracked": etf["index_tracked"],
        "num_holdings": etf["num_holdings"],
        "beginner_tags": etf["beginner_tags"],
        "volatility_3y": etf.get("volatility_3y"),
        "return_3y": etf.get("return_3y"),
    }


async def handle_search_etfs(arguments: dict) -> dict:
    """Zoek ETFs op basis van filters."""
    try:
        data = SearchETFsInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    results = list(ETF_CATALOG)

    if data.query:
        q = data.query.lower()
        results = [e for e in results if q in e["name"].lower() or q in e["ticker"].lower() or q in e["index_tracked"].lower()]

    if data.asset_class:
        results = [e for e in results if e["asset_class"] == data.asset_class]

    if data.region_focus:
        rf = data.region_focus.lower()
        results = [e for e in results if rf in e["region_focus"].lower()]

    if data.max_expense_ratio is not None:
        results = [e for e in results if e["expense_ratio"] <= data.max_expense_ratio]

    if data.distribution_type:
        results = [e for e in results if e["distribution_type"] == data.distribution_type]

    results = results[: data.limit]

    return {
        "success": True,
        "data": {
            "count": len(results),
            "etfs": [_etf_summary(e) for e in results],
        },
        "error": None,
    }


async def handle_get_etf_details(arguments: dict) -> dict:
    """Geef volledige details van één ETF."""
    try:
        data = GetETFDetailsInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    etf = ETF_BY_ISIN.get(data.isin)
    if not etf:
        return {"success": False, "data": None, "error": {"code": "ETF_NOT_FOUND", "message": f"ISIN {data.isin} niet gevonden."}}

    scores = compute_all_scores(etf)

    return {
        "success": True,
        "data": {**etf, "scores": scores},
        "error": None,
    }


async def handle_compare_etfs(arguments: dict) -> dict:
    """Vergelijk 2 of 3 ETFs naast elkaar."""
    try:
        data = CompareETFsInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    comparison = []
    not_found = []
    for isin in data.isins:
        etf = ETF_BY_ISIN.get(isin)
        if not etf:
            not_found.append(isin)
            continue
        scores = compute_all_scores(etf)
        comparison.append({
            "isin": etf["isin"],
            "ticker": etf["ticker"],
            "name": etf["name"],
            "expense_ratio": etf["expense_ratio"],
            "asset_class": etf["asset_class"],
            "region_focus": etf["region_focus"],
            "distribution_type": etf["distribution_type"],
            "num_holdings": etf["num_holdings"],
            "volatility_3y": etf.get("volatility_3y"),
            "return_3y": etf.get("return_3y"),
            "scores": scores,
        })

    if not_found:
        return {"success": False, "data": None, "error": {"code": "ETF_NOT_FOUND", "message": f"ISINs niet gevonden: {not_found}"}}

    # Bepaal winnaar per categorie
    best_cost = min(comparison, key=lambda x: x["expense_ratio"])
    best_spread = max(comparison, key=lambda x: x["num_holdings"])
    best_beginner = max(comparison, key=lambda x: x["scores"]["beginner_fit"])

    return {
        "success": True,
        "data": {
            "etfs": comparison,
            "highlights": {
                "laagste_kosten": best_cost["ticker"],
                "beste_spreiding": best_spread["ticker"],
                "beste_beginner_fit": best_beginner["ticker"],
            },
        },
        "error": None,
    }


def _etf_risk_level(etf: ETFRecord) -> int:
    """Leid een risicoscore (1-7) af uit de volatiliteit van het ETF.

    Args:
        etf: ETF-record uit de catalogus.

    Returns:
        Risicoscore tussen 1 (zeer laag) en 7 (zeer hoog).
    """
    vol = etf.get("volatility_3y")
    if vol is None:
        return 5 if etf["asset_class"] == "aandelen" else 3
    if vol <= 3:
        return 1
    if vol <= 5:
        return 2
    if vol <= 8:
        return 3
    if vol <= 12:
        return 4
    if vol <= 16:
        return 5
    if vol <= 20:
        return 6
    return 7


def _score_etf_for_profile(
    etf: ETFRecord,
    risk_level: int,
    horizon_years: int,
) -> tuple[float, str]:
    """Bereken een profielscore (0-100) voor een ETF en genereer een Nederlandse uitleg.

    Scoring breakdown:
    - Risk match   (40 pts): verschil per niveau kost 8 punten.
    - TER          (20 pts): lager is beter.
    - Horizon fit  (20 pts): aandelen passen bij lange horizon, obligaties bij korte.
    - Beginner fit (20 pts): genormaliseerd uit score_beginner_fit.

    Args:
        etf: ETF-record uit de catalogus.
        risk_level: Risicoscore van de gebruiker (1-7).
        horizon_years: Beleggingshorizon van de gebruiker in jaren.

    Returns:
        Tuple van (totaalscore 0-100, Nederlandse uitleg string).
    """
    reasons: list[str] = []

    # --- Risk match (40 pts) ---
    etf_risk = _etf_risk_level(etf)
    diff = abs(etf_risk - risk_level)
    risk_score = max(0, 40 - diff * 8)
    if diff == 0:
        reasons.append(f"het risiconiveau ({etf_risk}) perfect aansluit bij jouw profiel (niveau {risk_level})")
    elif diff <= 1:
        reasons.append(f"het risiconiveau ({etf_risk}) dicht bij jouw profiel (niveau {risk_level}) ligt")
    else:
        reasons.append(f"het risiconiveau ({etf_risk}) enigszins afwijkt van jouw profiel (niveau {risk_level})")

    # --- TER (20 pts) ---
    ter = etf["expense_ratio"]
    if ter < 0.10:
        ter_score = 20
        reasons.append(f"de kosten uitzonderlijk laag zijn ({ter:.2f}%/jaar)")
    elif ter < 0.20:
        ter_score = 15
        reasons.append(f"de kosten laag zijn ({ter:.2f}%/jaar)")
    elif ter < 0.30:
        ter_score = 10
        reasons.append(f"de kosten redelijk zijn ({ter:.2f}%/jaar)")
    else:
        ter_score = 5
        reasons.append(f"de kosten relatief hoog zijn ({ter:.2f}%/jaar)")

    # --- Horizon fit (20 pts) ---
    asset = etf["asset_class"]
    if asset == "aandelen":
        if horizon_years > 10:
            horizon_score = 20
            reasons.append(f"de lange horizon van {horizon_years} jaar goed aansluit bij aandelen-ETFs")
        elif horizon_years >= 5:
            horizon_score = 12
            reasons.append(f"de horizon van {horizon_years} jaar redelijk is voor aandelen")
        else:
            horizon_score = 4
            reasons.append(f"de korte horizon van {horizon_years} jaar aandelen iets risicovoller maakt")
    elif asset == "obligaties":
        if horizon_years > 10:
            horizon_score = 8
            reasons.append(f"obligaties minder optimaal zijn voor een horizon van {horizon_years} jaar")
        elif horizon_years >= 5:
            horizon_score = 16
            reasons.append(f"de horizon van {horizon_years} jaar goed aansluit bij obligaties")
        else:
            horizon_score = 20
            reasons.append(f"de korte horizon van {horizon_years} jaar uitstekend past bij obligaties")
    else:
        horizon_score = 14
        reasons.append(f"dit gemengd fonds flexibel is voor een horizon van {horizon_years} jaar")

    # --- Beginner fit (20 pts) ---
    bf_raw, _ = score_beginner_fit(etf)
    beginner_score = round(bf_raw / 100 * 20)

    total = risk_score + ter_score + horizon_score + beginner_score

    # Bouw Nederlandse reden in mensentaal
    if reasons:
        reden_body = ", ".join(reasons[:-1])
        if len(reasons) > 1:
            reden_body += " en " + reasons[-1]
        else:
            reden_body = reasons[0]
    else:
        reden_body = "dit ETF aansluit bij de opgegeven criteria"

    reden = (
        f"Past mogelijk bij jouw profiel (risiconiveau {risk_level}) omdat {reden_body}. "
        f"Kosten: {ter:.2f}%/jaar."
    )

    return float(total), reden


async def handle_get_top3_for_profile(arguments: dict) -> dict:
    """Geef de top 3 meest geschikte ETFs voor een gebruikersprofiel.

    Valideert de invoer, berekent een samengestelde score per ETF en retourneert
    de drie hoogst scorende ETFs met mensentaal-uitleg.

    Args:
        arguments: Woordenboek met risk_level, horizon_years, monthly_investment
                   en optioneel preferred_category.

    Returns:
        MCP-resultaat met success, data (top3 + profile_summary) of error.
    """
    try:
        data = GetTop3ForProfileInputV2(**arguments)
    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": {"code": "INVALID_INPUT", "message": str(exc)},
        }

    candidates = list(ETF_CATALOG)

    if data.preferred_category:
        category_lower = data.preferred_category.lower().strip()
        filtered = [e for e in candidates if e["asset_class"] == category_lower]
        if filtered:
            candidates = filtered

    scored: list[tuple[ETFRecord, float, str]] = []
    for etf in candidates:
        score, reden = _score_etf_for_profile(etf, data.risk_level, data.horizon_years)
        scored.append((etf, score, reden))

    scored.sort(key=lambda x: x[1], reverse=True)
    top3 = scored[:3]

    result_top3 = []
    for rank, (etf, score, reden) in enumerate(top3, start=1):
        result_top3.append({
            "rank": rank,
            "isin": etf["isin"],
            "ticker": etf["ticker"],
            "naam": etf["name"],
            "score": round(score, 1),
            "reden": reden,
            "expense_ratio": etf["expense_ratio"],
            "categorie": etf["asset_class"],
        })

    risk_labels = {
        1: "zeer defensief",
        2: "defensief",
        3: "licht defensief",
        4: "gematigd",
        5: "licht offensief",
        6: "offensief",
        7: "agressief",
    }
    risk_label = risk_labels.get(data.risk_level, str(data.risk_level))
    horizon_label = f"{data.horizon_years} {'jaar' if data.horizon_years == 1 else 'jaar'}"
    investment_label = f"€{data.monthly_investment:.0f}/maand" if data.monthly_investment > 0 else "geen vaste inleg opgegeven"

    profile_summary = (
        f"Jij hebt een {risk_label} risicoprofiel (niveau {data.risk_level}/7) "
        f"met een horizon van {horizon_label} en een inleg van {investment_label}. "
        f"Op basis daarvan zijn de onderstaande ETFs mogelijk passend."
    )

    return {
        "success": True,
        "data": {
            "top3": result_top3,
            "profile_summary": profile_summary,
        },
        "error": None,
    }


async def handle_filter_etfs_for_beginner(arguments: dict) -> dict:
    """Filter en rangschik ETFs op basis van een beginnersprofiel."""
    try:
        data = FilterForBeginnerInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    candidates = list(ETF_CATALOG)

    # Sluit hoog-risico ETFs uit voor laag-profiel beleggers
    if data.risk_tolerance == "laag":
        candidates = [e for e in candidates if e["asset_class"] in ("obligaties", "gemengd") or
                      (e["asset_class"] == "aandelen" and (e.get("volatility_3y") or 99) <= 14)]

    # Sluit pure obligatie-ETFs uit voor lange horizons + hoog profiel
    if data.risk_tolerance == "hoog" and data.horizon_years >= 10:
        candidates = [e for e in candidates if e["asset_class"] != "obligaties"]

    # Voeg scores toe en sorteer
    scored = []
    for etf in candidates:
        scores = compute_all_scores(etf, data.risk_tolerance, data.horizon_years)
        scored.append({"etf": _etf_summary(etf), "scores": scores})

    scored.sort(key=lambda x: x["scores"]["overall_fit"], reverse=True)
    top = scored[: data.limit]

    return {
        "success": True,
        "data": {
            "profile": {
                "risk_tolerance": data.risk_tolerance,
                "horizon_years": data.horizon_years,
                "monthly_budget": data.monthly_budget,
                "experience_level": data.experience_level,
            },
            "count": len(top),
            "recommendations": top,
            "disclaimer": (
                "Deze informatie is uitsluitend bedoeld voor educatieve doeleinden en vormt geen beleggingsadvies. "
                "In het verleden behaalde resultaten bieden geen garantie voor de toekomst."
            ),
        },
        "error": None,
    }
