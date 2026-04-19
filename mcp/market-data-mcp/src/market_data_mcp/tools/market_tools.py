"""Tools voor market-data-mcp."""
import random
import math
from datetime import date
from pydantic import BaseModel, Field
from typing import Optional

_ETF_DATA: dict[str, dict] = {
    "IE00B4L5Y983": {
        "name": "iShares Core MSCI World UCITS ETF (IWDA)",
        "return_3y": 9.2,
        "volatility_3y": 14.8,
        "max_drawdown": -33.8,
        "region": "wereld",
        "asset_class": "aandelen",
    },
    "IE00BK5BQT80": {
        "name": "Vanguard FTSE All-World UCITS ETF (VWCE)",
        "return_3y": 9.0,
        "volatility_3y": 15.0,
        "max_drawdown": -34.2,
        "region": "wereld",
        "asset_class": "aandelen",
    },
    "IE00B5BMR087": {
        "name": "iShares Core S&P 500 UCITS ETF (CSPX)",
        "return_3y": 11.5,
        "volatility_3y": 16.2,
        "max_drawdown": -33.9,
        "region": "VS",
        "asset_class": "aandelen",
    },
    "IE00B4L5YC18": {
        "name": "iShares Core € Govt Bond UCITS ETF (IEGA)",
        "return_3y": -1.2,
        "volatility_3y": 6.8,
        "max_drawdown": -18.5,
        "region": "eurozone",
        "asset_class": "obligaties",
    },
    "IE00BDBRDM35": {
        "name": "iShares Core Global Aggregate Bond UCITS ETF (AGGH)",
        "return_3y": -0.8,
        "volatility_3y": 7.2,
        "max_drawdown": -19.1,
        "region": "wereld",
        "asset_class": "obligaties",
    },
}


class GetPriceHistoryInput(BaseModel):
    isin: str = Field(..., min_length=12, max_length=12)
    years: int = Field(..., ge=1, le=10)


class CalculateVolatilityInput(BaseModel):
    isin: str = Field(..., min_length=12, max_length=12)


class CalculateDrawdownInput(BaseModel):
    isin: str = Field(..., min_length=12, max_length=12)


class ComparePerformanceInput(BaseModel):
    isins: list[str] = Field(..., min_length=2, max_length=5)
    years: int = Field(3, ge=1, le=10)


def _volatility_label(vol: float) -> str:
    if vol < 8:
        return "laag"
    if vol < 14:
        return "gemiddeld"
    return "hoog"


def _generate_price_series(isin: str, years: int) -> list[dict]:
    etf = _ETF_DATA[isin]
    annual_return = etf["return_3y"] / 100
    annual_vol = etf["volatility_3y"] / 100
    monthly_return = (1 + annual_return) ** (1 / 12) - 1
    monthly_vol = annual_vol / math.sqrt(12)

    rng = random.Random(hash(isin) % (2**31))
    price = 100.0
    result = []

    today = date.today()
    start_month = today.month - (years * 12 - 1)
    start_year = today.year
    while start_month <= 0:
        start_month += 12
        start_year -= 1

    for i in range(years * 12):
        month = (start_month + i - 1) % 12 + 1
        year = start_year + (start_month + i - 1) // 12
        shock = rng.gauss(monthly_return, monthly_vol)
        price = max(price * (1 + shock), 0.01)
        result.append({"date": f"{year:04d}-{month:02d}", "price": round(price, 2)})

    return result


async def handle_get_price_history(arguments: dict) -> dict:
    try:
        data = GetPriceHistoryInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    etf = _ETF_DATA.get(data.isin)
    if not etf:
        return {"success": False, "data": None, "error": {"code": "ETF_NOT_FOUND", "message": f"ISIN {data.isin} niet gevonden."}}

    history = _generate_price_series(data.isin, data.years)

    return {
        "success": True,
        "data": {
            "isin": data.isin,
            "name": etf["name"],
            "years": data.years,
            "start_price": 100.0,
            "end_price": history[-1]["price"],
            "price_history": history,
            "disclaimer": "Synthetische data op basis van historische statistieken — geen echte koersen.",
        },
        "error": None,
    }


async def handle_calculate_volatility(arguments: dict) -> dict:
    try:
        data = CalculateVolatilityInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    etf = _ETF_DATA.get(data.isin)
    if not etf:
        return {"success": False, "data": None, "error": {"code": "ETF_NOT_FOUND", "message": f"ISIN {data.isin} niet gevonden."}}

    vol = etf["volatility_3y"]
    label = _volatility_label(vol)

    explanation = (
        f"Volatiliteit geeft aan hoe sterk de koers van een ETF schommelt. "
        f"{etf['name']} heeft een jaarlijkse volatiliteit van {vol}% — dat is '{label}'. "
    )
    if label == "laag":
        explanation += "Dit betekent dat de koers relatief stabiel is, zoals je dat verwacht bij obligaties."
    elif label == "gemiddeld":
        explanation += "De koers beweegt matig — niet heel rustig, maar ook niet extreem. Goed voor een gemengd profiel."
    else:
        explanation += (
            f"De koers kan in een jaar met wel {vol:.0f}% omhoog of omlaag gaan. "
            "Dit is normaal voor wereldwijde aandelenindexen en hoort erbij op lange termijn."
        )

    return {
        "success": True,
        "data": {
            "isin": data.isin,
            "name": etf["name"],
            "volatility_3y": vol,
            "volatility_label": label,
            "explanation": explanation,
        },
        "error": None,
    }


async def handle_calculate_drawdown(arguments: dict) -> dict:
    try:
        data = CalculateDrawdownInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    etf = _ETF_DATA.get(data.isin)
    if not etf:
        return {"success": False, "data": None, "error": {"code": "ETF_NOT_FOUND", "message": f"ISIN {data.isin} niet gevonden."}}

    dd = etf["max_drawdown"]

    explanation = (
        f"De maximale drawdown is de grootste koersdaling van piek naar dal. "
        f"Voor {etf['name']} bedroeg die historisch {dd:.1f}%. "
        "Dit betekent dat beleggers die op het slechtst mogelijke moment instapten, "
        f"tijdelijk {abs(dd):.0f}% van hun inleg zagen verdwijnen."
    )

    if etf["asset_class"] == "aandelen":
        historical_context = (
            "Grote dalingen bij aandelenindexen kwamen voor tijdens de financiële crisis van 2008-2009 "
            "(-50% voor wereldwijde indices), de COVID-crash van 2020 (-34%) en de rentecorrectie van 2022 (-25%). "
            "In alle gevallen herstelden de markten zich op termijn volledig."
        )
    else:
        historical_context = (
            "Obligaties daalden sterk in 2022 door de snelle rentestijgingen van centrale banken. "
            "Historisch gezien zijn obligatiedalingen minder groot dan aandelendalingen, maar ze zijn niet risicovrij."
        )

    return {
        "success": True,
        "data": {
            "isin": data.isin,
            "name": etf["name"],
            "max_drawdown": dd,
            "explanation": explanation,
            "historical_context": historical_context,
        },
        "error": None,
    }


async def handle_compare_performance(arguments: dict) -> dict:
    try:
        data = ComparePerformanceInput(**arguments)
    except Exception as e:
        return {"success": False, "data": None, "error": {"code": "VALIDATION_ERROR", "message": str(e)}}

    comparison = []
    not_found = []
    for isin in data.isins:
        etf = _ETF_DATA.get(isin)
        if not etf:
            not_found.append(isin)
            continue
        comparison.append({
            "isin": isin,
            "name": etf["name"],
            "return_3y": etf["return_3y"],
            "volatility_3y": etf["volatility_3y"],
            "volatility_label": _volatility_label(etf["volatility_3y"]),
            "max_drawdown": etf["max_drawdown"],
            "asset_class": etf["asset_class"],
            "region": etf["region"],
        })

    if not_found:
        return {"success": False, "data": None, "error": {"code": "ETF_NOT_FOUND", "message": f"ISINs niet gevonden: {not_found}"}}

    best_return = max(comparison, key=lambda x: x["return_3y"])
    lowest_vol = min(comparison, key=lambda x: x["volatility_3y"])
    lowest_dd = max(comparison, key=lambda x: x["max_drawdown"])  # max = least negative

    return {
        "success": True,
        "data": {
            "years_compared": data.years,
            "etfs": comparison,
            "highlights": {
                "hoogste_rendement": f"{best_return['name']} ({best_return['return_3y']}%/jaar)",
                "laagste_volatiliteit": f"{lowest_vol['name']} ({lowest_vol['volatility_3y']}%)",
                "kleinste_drawdown": f"{lowest_dd['name']} ({lowest_dd['max_drawdown']}%)",
            },
            "disclaimer": "Rendementen zijn gebaseerd op historische statistieken en geen garantie voor de toekomst.",
        },
        "error": None,
    }
