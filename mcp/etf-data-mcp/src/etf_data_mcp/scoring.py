"""
Scoring-engine voor ETF beginner-fit, discipline-fit en risk-fit.
Scores zijn altijd voorzien van een uitleggende tekst in het Nederlands.
"""
from .data import ETFRecord


def score_beginner_fit(etf: ETFRecord) -> tuple[int, str]:
    """Bereken beginner-fit score (0–100) met uitleg."""
    score = 0
    reasons = []

    # Spreiding (40 punten)
    holdings = etf["num_holdings"]
    if holdings >= 1000:
        score += 40
        reasons.append(f"breed gespreid over {holdings:,} posities")
    elif holdings >= 300:
        score += 25
        reasons.append(f"redelijk gespreid over {holdings} posities")
    elif holdings >= 50:
        score += 10
        reasons.append(f"beperkte spreiding ({holdings} posities)")
    else:
        reasons.append(f"weinig spreiding ({holdings} posities)")

    # Kosten (30 punten)
    ter = etf["expense_ratio"]
    if ter <= 0.10:
        score += 30
        reasons.append(f"zeer lage kosten ({ter:.2f}% per jaar)")
    elif ter <= 0.20:
        score += 22
        reasons.append(f"lage kosten ({ter:.2f}% per jaar)")
    elif ter <= 0.35:
        score += 12
        reasons.append(f"gemiddelde kosten ({ter:.2f}% per jaar)")
    else:
        score += 5
        reasons.append(f"hogere kosten ({ter:.2f}% per jaar)")

    # Volatiliteit (20 punten)
    vol = etf.get("volatility_3y")
    if vol is not None:
        if vol <= 8:
            score += 20
            reasons.append("lage volatiliteit (stabiel)")
        elif vol <= 15:
            score += 14
            reasons.append("gemiddelde volatiliteit")
        elif vol <= 20:
            score += 7
            reasons.append("hogere volatiliteit")
        else:
            reasons.append("hoge volatiliteit (meer schommelingen)")

    # Replicatie transparantie (10 punten)
    if etf["replication_method"] == "fysiek":
        score += 10
        reasons.append("fysieke replicatie (transparant)")
    elif etf["replication_method"] == "gesampled":
        score += 7
        reasons.append("gesampled replicatie")
    else:
        score += 3
        reasons.append("synthetische replicatie (iets complexer)")

    explanation = (
        f"Deze ETF scoort {score}/100 voor beginners omdat hij "
        + ", ".join(reasons[:-1])
        + (" en " + reasons[-1] if len(reasons) > 1 else reasons[0] if reasons else "")
        + "."
    )
    return min(score, 100), explanation


def score_discipline_fit(etf: ETFRecord) -> tuple[int, str]:
    """Bereken discipline-fit score — geschikt voor maandelijkse inleg zonder actieve opvolging."""
    score = 70  # basisniveau voor elke brede ETF
    reasons = []

    if etf["asset_class"] in ("aandelen", "obligaties", "gemengd"):
        score += 10
        reasons.append("eenvoudige, stabiele strategie")

    if etf["distribution_type"] == "accumulating":
        score += 10
        reasons.append("dividenden worden automatisch herbelegd")
    else:
        reasons.append("dividend wordt uitbetaald (zelf herbeleggen)")

    if etf["replication_method"] != "synthetisch":
        score += 10
        reasons.append("weinig actieve opvolging nodig")

    explanation = (
        f"Voor maandelijks inleggen scoort deze ETF {score}/100: "
        + ", ".join(reasons) + "."
    )
    return min(score, 100), explanation


def score_risk_fit(etf: ETFRecord, risk_tolerance: str, horizon_years: int) -> tuple[int, str]:
    """Vergelijk ETF-risico met gebruikersprofiel."""
    score = 50
    reasons = []
    vol = etf.get("volatility_3y", 15.0)
    asset = etf["asset_class"]

    # Risicotolerantie match
    if risk_tolerance == "laag":
        if asset == "obligaties":
            score += 30
            reasons.append("obligatie-ETF past bij laag risicoprofiel")
        elif vol and vol <= 10:
            score += 20
            reasons.append("lage volatiliteit past bij jouw voorzichtige profiel")
        elif asset == "aandelen":
            score -= 20
            reasons.append("aandelen-ETF heeft meer schommelingen dan jouw profiel aangeeft")
    elif risk_tolerance == "matig":
        if asset == "aandelen" and vol and vol <= 16:
            score += 25
            reasons.append("gematigde volatiliteit past bij jouw profiel")
        elif asset == "obligaties":
            score += 10
            reasons.append("obligaties kunnen stabiliseren in jouw portefeuille")
    elif risk_tolerance == "hoog":
        if asset == "aandelen":
            score += 30
            reasons.append("aandelen-ETF past bij jouw bereidheid tot meer schommelingen")

    # Horizon match
    if horizon_years >= 10 and asset == "aandelen":
        score += 15
        reasons.append(f"lange horizon van {horizon_years} jaar is goed voor aandelen")
    elif horizon_years < 5 and asset == "aandelen":
        score -= 15
        reasons.append(f"korte horizon van {horizon_years} jaar maakt aandelen-ETF risicovol")
    elif horizon_years < 5 and asset == "obligaties":
        score += 10
        reasons.append("obligaties passen beter bij een kortere tijdshorizon")

    explanation = (
        f"Risk-fit score: {score}/100. "
        + " ".join(reasons) + "."
    )
    return max(0, min(score, 100)), explanation


def compute_all_scores(
    etf: ETFRecord,
    risk_tolerance: str = "matig",
    horizon_years: int = 10,
) -> dict:
    """Bereken alle drie scores en een gewogen totaal."""
    bf_score, bf_expl = score_beginner_fit(etf)
    df_score, df_expl = score_discipline_fit(etf)
    rf_score, rf_expl = score_risk_fit(etf, risk_tolerance, horizon_years)

    overall = round(bf_score * 0.40 + df_score * 0.25 + rf_score * 0.35)

    return {
        "isin": etf["isin"],
        "beginner_fit": bf_score,
        "beginner_fit_explanation": bf_expl,
        "discipline_fit": df_score,
        "discipline_fit_explanation": df_expl,
        "risk_fit": rf_score,
        "risk_fit_explanation": rf_expl,
        "overall_fit": overall,
    }
