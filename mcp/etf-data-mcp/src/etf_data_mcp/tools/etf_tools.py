"""Tools voor etf-data-mcp."""
from ..schemas import SearchETFsInput, GetETFDetailsInput, CompareETFsInput, FilterForBeginnerInput, GetTop3ForProfileInput
from ..data import ETF_CATALOG, ETF_BY_ISIN
from ..scoring import compute_all_scores


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


async def handle_get_top3_for_profile(arguments: dict) -> dict:
    """Geef de top 3 meest geschikte ETFs voor een gebruikersprofiel."""
    try:
        data = GetTop3ForProfileInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    candidates = list(ETF_CATALOG)

    # Filter op basis van risicoprofiel
    if data.risk_tolerance == "laag":
        candidates = [
            e for e in candidates
            if not (e["asset_class"] == "aandelen" and (e.get("volatility_3y") or 0) > 12)
        ]

    if data.risk_tolerance == "hoog" and data.horizon_years >= 10:
        candidates = [e for e in candidates if e["asset_class"] != "obligaties"]

    # Scoor en sorteer
    scored = []
    for etf in candidates:
        scores = compute_all_scores(etf, data.risk_tolerance, data.horizon_years)
        scored.append((etf, scores))

    scored.sort(key=lambda x: x[1]["overall_fit"], reverse=True)
    top3 = scored[:3]

    # Bouw top3 resultaat
    result_top3 = []
    for rank, (etf, scores) in enumerate(top3, start=1):
        expense_ratio = etf["expense_ratio"]
        yearly_cost = data.monthly_budget * expense_ratio / 100
        monthly_cost_estimate = (
            f"Bij €{data.monthly_budget:.0f}/maand kost dit ETF je "
            f"€{yearly_cost:.2f}/jaar aan beheerkosten (TER {expense_ratio:.2f}%)."
        )

        bf_expl = scores["beginner_fit_explanation"]
        rf_expl = scores["risk_fit_explanation"]
        # Extraheer de kernredenen uit de beginner-uitleg (na "omdat hij ")
        bf_body = bf_expl.split("omdat hij ")[-1].rstrip(".") if "omdat hij " in bf_expl else bf_expl.rstrip(".")
        why_this_etf = (
            f"#{rank} keuze voor jou: {etf['name']} past bij jouw {data.risk_tolerance} risicoprofiel "
            f"omdat hij {bf_body}. {rf_expl}"
        )

        result_top3.append({
            "rank": rank,
            "isin": etf["isin"],
            "ticker": etf["ticker"],
            "name": etf["name"],
            "overall_score": scores["overall_fit"],
            "why_this_etf": why_this_etf,
            "monthly_cost_estimate": monthly_cost_estimate,
            "scores": {
                "beginner_fit": scores["beginner_fit"],
                "discipline_fit": scores["discipline_fit"],
                "risk_fit": scores["risk_fit"],
                "overall_fit": scores["overall_fit"],
            },
        })

    # Profielomschrijving in mensentaal
    budget_label = "laag instapbedrag" if data.monthly_budget < 50 else f"€{data.monthly_budget:.0f}/maand"
    horizon_label = f"{data.horizon_years} jaar"
    experience_map = {"geen": "geen beleggingservaring", "basis": "basiskennis", "gevorderd": "gevorderde kennis"}
    profile_summary = (
        f"Jij hebt een {data.risk_tolerance} risicoprofiel met een horizon van {horizon_label} "
        f"en legt {budget_label} in. "
        f"Je hebt {experience_map.get(data.experience_level, data.experience_level)}. "
        f"Dat is een {'solide' if data.horizon_years >= 10 else 'korte'} basis voor vermogensopbouw."
    )

    return {
        "success": True,
        "data": {
            "profile_summary": profile_summary,
            "top3": result_top3,
            "disclaimer": (
                "Dit is educatieve informatie en geen financieel advies. "
                "Past mogelijk bij jouw profiel op basis van de door jou opgegeven criteria."
            ),
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
