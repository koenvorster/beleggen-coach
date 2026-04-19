"""Tools voor portfolio-plan-mcp."""
from ..schemas import (
    GenerateBeginnerPlanInput,
    SimulateMonthlyInvestingInput,
    SuggestAllocationInput,
    CheckDiversificationInput,
    AllocationItem,
)

_DISCLAIMER = (
    "Deze informatie is uitsluitend bedoeld voor educatieve doeleinden en vormt geen beleggingsadvies. "
    "In het verleden behaalde resultaten bieden geen garantie voor de toekomst. "
    "Raadpleeg een erkend financieel adviseur voor persoonlijk advies."
)

_ETF_INFO: dict[str, dict] = {
    "IE00B4L5Y983": {"name": "iShares Core MSCI World UCITS ETF (IWDA)", "asset_class": "aandelen", "region": "wereld"},
    "IE00BK5BQT80": {"name": "Vanguard FTSE All-World UCITS ETF (VWCE)", "asset_class": "aandelen", "region": "wereld"},
    "IE00B5BMR087": {"name": "iShares Core S&P 500 UCITS ETF (CSPX)", "asset_class": "aandelen", "region": "VS"},
    "IE00B4L5YC18": {"name": "iShares Core € Govt Bond UCITS ETF (IEGA)", "asset_class": "obligaties", "region": "eurozone"},
    "IE00BDBRDM35": {"name": "iShares Core Global Aggregate Bond UCITS ETF (AGGH)", "asset_class": "obligaties", "region": "wereld"},
}

_ALLOCATIONS: dict[str, list[dict]] = {
    "laag": [
        {
            "etf_isin": "IE00B4L5Y983",
            "etf_name": "iShares Core MSCI World UCITS ETF (IWDA)",
            "percentage": 30.0,
            "rationale": "Brede wereldwijde aandelenspreiding met lage kosten voor het groeistuk van de portefeuille.",
        },
        {
            "etf_isin": "IE00BDBRDM35",
            "etf_name": "iShares Core Global Aggregate Bond UCITS ETF (AGGH)",
            "percentage": 70.0,
            "rationale": "Wereldwijde obligaties als stabiel fundament; dempen de koersschommelingen aanzienlijk.",
        },
    ],
    "matig": [
        {
            "etf_isin": "IE00BK5BQT80",
            "etf_name": "Vanguard FTSE All-World UCITS ETF (VWCE)",
            "percentage": 80.0,
            "rationale": "Zeer brede wereldwijde aandelenspreiding (>3 700 aandelen) voor de groeimotor.",
        },
        {
            "etf_isin": "IE00BDBRDM35",
            "etf_name": "iShares Core Global Aggregate Bond UCITS ETF (AGGH)",
            "percentage": 20.0,
            "rationale": "Klein obligatieblok als buffer bij marktcorrecties.",
        },
    ],
    "hoog": [
        {
            "etf_isin": "IE00BK5BQT80",
            "etf_name": "Vanguard FTSE All-World UCITS ETF (VWCE)",
            "percentage": 100.0,
            "rationale": "100% aandelen voor maximale groei op lange termijn; hogere kortetermijnschommelingen zijn de prijs.",
        },
    ],
}

_RISK_NOTES: dict[str, str] = {
    "laag": (
        "Met 70% obligaties is deze portefeuille defensief. Je beschermt je kapitaal beter, "
        "maar het groeipotentieel is lager. Geschikt als je weinig verlies kan verdragen."
    ),
    "matig": (
        "Een evenwichtige keuze: aanzienlijk groeipotentieel met een kleine obligatiebuffer. "
        "Je moet wel bestand zijn tegen tijdelijke dalingen van 20-30%."
    ),
    "hoog": (
        "Volledig in aandelen betekent dat je portefeuille kan dalen met 40-50% in een slechte periode. "
        "Dit profiel is alleen zinvol bij een horizon van minstens 10 jaar en sterke emotionele veerkracht."
    ),
}


def _fv(pmt: float, annual_rate: float, years: int) -> float:
    """Toekomstige waarde van maandelijkse stortingen."""
    if annual_rate == 0:
        return pmt * years * 12
    r = annual_rate / 12
    n = years * 12
    return pmt * (((1 + r) ** n - 1) / r)


async def handle_generate_beginner_plan(arguments: dict) -> dict:
    try:
        data = GenerateBeginnerPlanInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    allocation = _ALLOCATIONS.get(data.risk_tolerance, _ALLOCATIONS["matig"])
    risk_notes = _RISK_NOTES.get(data.risk_tolerance, "")

    plan_rationale = (
        f"Op basis van jouw risicoprofiel ({data.risk_tolerance}), een horizon van {data.horizon_years} jaar "
        f"en een maandbudget van €{data.monthly_budget:.0f} voor '{data.goal_type}', "
        "stellen we een eenvoudig, goedkoop en goed gespreid plan voor met wereldwijde index-ETFs."
    )

    return {
        "success": True,
        "data": {
            "allocation": allocation,
            "monthly_amount": data.monthly_budget,
            "plan_rationale": plan_rationale,
            "risk_notes": risk_notes,
            "disclaimer": _DISCLAIMER,
        },
        "error": None,
    }


async def handle_simulate_monthly_investing(arguments: dict) -> dict:
    try:
        data = SimulateMonthlyInvestingInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    data_points = []
    for year in range(1, data.horizon_years + 1):
        total_invested = data.monthly_amount * year * 12
        data_points.append({
            "year": year,
            "pessimistic": round(_fv(data.monthly_amount, data.pessimistic_rate, year), 2),
            "realistic": round(_fv(data.monthly_amount, data.realistic_rate, year), 2),
            "optimistic": round(_fv(data.monthly_amount, data.optimistic_rate, year), 2),
            "total_invested": round(total_invested, 2),
        })

    final = data_points[-1]
    summary = (
        f"Na {data.horizon_years} jaar maandelijks €{data.monthly_amount:.0f} beleggen "
        f"(totaal ingelegd: €{final['total_invested']:,.0f}):\n"
        f"- Pessimistisch ({data.pessimistic_rate*100:.0f}%/jaar): €{final['pessimistic']:,.0f}\n"
        f"- Realistisch ({data.realistic_rate*100:.0f}%/jaar): €{final['realistic']:,.0f}\n"
        f"- Optimistisch ({data.optimistic_rate*100:.0f}%/jaar): €{final['optimistic']:,.0f}"
    )

    return {
        "success": True,
        "data": {
            "monthly_amount": data.monthly_amount,
            "horizon_years": data.horizon_years,
            "data_points": data_points,
            "summary": summary,
            "disclaimer": _DISCLAIMER,
        },
        "error": None,
    }


async def handle_suggest_allocation(arguments: dict) -> dict:
    try:
        data = SuggestAllocationInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    risk = data.risk_tolerance.lower() if data.risk_tolerance.lower() in _ALLOCATIONS else "matig"

    allocation = list(_ALLOCATIONS[risk])

    # Verwijder obligaties als gevraagd en herverdeel naar aandelen
    if not data.include_bonds:
        allocation = [a for a in allocation if _ETF_INFO.get(a["etf_isin"], {}).get("asset_class") != "obligaties"]
        total = sum(a["percentage"] for a in allocation)
        if total > 0:
            for a in allocation:
                a = dict(a)
                a["percentage"] = round(a["percentage"] / total * 100, 1)

    explanation = (
        f"Voor een {risk} risicoprofiel met {data.horizon_years} jaar horizon raden we aan: "
        + ", ".join(f"{a['etf_name']} ({a['percentage']}%)" for a in allocation)
        + ". "
        + (_RISK_NOTES.get(risk, ""))
    )

    return {
        "success": True,
        "data": {
            "allocation": allocation,
            "explanation": explanation,
        },
        "error": None,
    }


async def handle_check_diversification(arguments: dict) -> dict:
    try:
        data = CheckDiversificationInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    issues: list[str] = []
    suggestions: list[str] = []
    score = 100

    total_pct = sum(a.percentage for a in data.allocation)
    if abs(total_pct - 100) > 1:
        issues.append(f"De percentages tellen op tot {total_pct:.1f}% in plaats van 100%.")
        suggestions.append("Zorg dat alle percentages samen optellen tot 100%.")
        score -= 20

    for item in data.allocation:
        if item.percentage > 90:
            issues.append(
                f"ETF {item.etf_isin} heeft {item.percentage:.0f}% van de portefeuille — dat is erg geconcentreerd."
            )
            suggestions.append(
                f"Overweeg de positie in {item.etf_isin} te spreiden over meerdere ETFs of regio's."
            )
            score -= 30
            break

    # Controleer of er obligaties aanwezig zijn
    bond_isins = {"IE00BDBRDM35", "IE00B4L5YC18", "IE00B6YX5C33"}
    has_bonds = any(a.etf_isin in bond_isins for a in data.allocation)
    has_equity = any(a.etf_isin not in bond_isins for a in data.allocation)

    if not has_bonds and has_equity and len(data.allocation) == 1:
        issues.append("De portefeuille bestaat uit slechts één ETF.")
        suggestions.append("Voeg een obligatie-ETF toe voor extra stabiliteit, tenzij je een zeer lange horizon hebt.")
        score -= 15

    if not has_bonds and has_equity:
        suggestions.append(
            "Overweeg een klein aandeel obligaties (10-30%) toe te voegen als buffer bij marktcorrecties."
        )

    # Controleer regio-concentratie via bekende ISINs
    us_heavy_isins = {"IE00B5BMR087"}
    us_only = all(a.etf_isin in us_heavy_isins for a in data.allocation)
    if us_only:
        issues.append("De portefeuille is geconcentreerd in één regio (VS).")
        suggestions.append("Voeg een wereldwijde ETF toe voor betere geografische spreiding.")
        score -= 20

    score = max(0, min(100, score))

    if score >= 80:
        score_label = "Goed gespreid"
    elif score >= 50:
        score_label = "Redelijke spreiding, ruimte voor verbetering"
    else:
        score_label = "Beperkte spreiding — herziening aanbevolen"

    return {
        "success": True,
        "data": {
            "diversification_score": score,
            "score_label": score_label,
            "issues": issues,
            "suggestions": suggestions if suggestions else ["De portefeuille ziet er goed gespreid uit."],
        },
        "error": None,
    }
