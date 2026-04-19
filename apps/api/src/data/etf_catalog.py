"""ETF catalogus — hard-coded dataset van 10 geselecteerde ETFs."""
from typing import TypedDict


class ETFEntry(TypedDict):
    isin: str
    ticker: str
    name: str
    expense_ratio: float
    categorie: str
    regio: str
    dividend: str
    replicatie: str
    aum_mln: int
    holdings: int


ETF_CATALOG: list[ETFEntry] = [
    {
        "isin": "IE00B4L5Y983",
        "ticker": "IWDA",
        "name": "iShares Core MSCI World",
        "expense_ratio": 0.20,
        "categorie": "aandelen",
        "regio": "World",
        "dividend": "accumulating",
        "replicatie": "fysiek",
        "aum_mln": 65000,
        "holdings": 1467,
    },
    {
        "isin": "IE00B3RBWM25",
        "ticker": "VWRL",
        "name": "Vanguard FTSE All-World",
        "expense_ratio": 0.22,
        "categorie": "aandelen",
        "regio": "World",
        "dividend": "distributing",
        "replicatie": "fysiek",
        "aum_mln": 18000,
        "holdings": 3700,
    },
    {
        "isin": "IE00BK5BQT80",
        "ticker": "VWCE",
        "name": "Vanguard FTSE All-World Acc",
        "expense_ratio": 0.22,
        "categorie": "aandelen",
        "regio": "World",
        "dividend": "accumulating",
        "replicatie": "fysiek",
        "aum_mln": 22000,
        "holdings": 3700,
    },
    {
        "isin": "IE00B5BMR087",
        "ticker": "SXR8",
        "name": "iShares Core S&P 500",
        "expense_ratio": 0.07,
        "categorie": "aandelen",
        "regio": "USA",
        "dividend": "accumulating",
        "replicatie": "fysiek",
        "aum_mln": 75000,
        "holdings": 503,
    },
    {
        "isin": "LU0274208692",
        "ticker": "XDWD",
        "name": "Xtrackers MSCI World Swap",
        "expense_ratio": 0.19,
        "categorie": "aandelen",
        "regio": "World",
        "dividend": "accumulating",
        "replicatie": "synthetisch",
        "aum_mln": 8000,
        "holdings": 1467,
    },
    {
        "isin": "IE00B4WXJJ64",
        "ticker": "EMIM",
        "name": "iShares Core MSCI EM IMI",
        "expense_ratio": 0.18,
        "categorie": "aandelen",
        "regio": "Opkomende markten",
        "dividend": "accumulating",
        "replicatie": "fysiek",
        "aum_mln": 19000,
        "holdings": 3200,
    },
    {
        "isin": "IE00B3F81R35",
        "ticker": "IMEU",
        "name": "iShares Core MSCI Europe",
        "expense_ratio": 0.12,
        "categorie": "aandelen",
        "regio": "Europa",
        "dividend": "accumulating",
        "replicatie": "fysiek",
        "aum_mln": 7500,
        "holdings": 433,
    },
    {
        "isin": "IE00B4L5YC18",
        "ticker": "AGGH",
        "name": "iShares Core Global Aggregate Bond",
        "expense_ratio": 0.10,
        "categorie": "obligaties",
        "regio": "World",
        "dividend": "accumulating",
        "replicatie": "gesampled",
        "aum_mln": 12000,
        "holdings": 10000,
    },
    {
        "isin": "IE00B3F81409",
        "ticker": "EUN5",
        "name": "iShares € Govt Bond 3-5yr",
        "expense_ratio": 0.20,
        "categorie": "obligaties",
        "regio": "Europa",
        "dividend": "distributing",
        "replicatie": "fysiek",
        "aum_mln": 2500,
        "holdings": 120,
    },
    {
        "isin": "IE00B3XXRP09",
        "ticker": "VAGF",
        "name": "Vanguard Global Aggregate Bond",
        "expense_ratio": 0.10,
        "categorie": "obligaties",
        "regio": "World",
        "dividend": "accumulating",
        "replicatie": "gesampled",
        "aum_mln": 4800,
        "holdings": 9500,
    },
]

# Index op ISIN voor snelle opzoeking
ETF_BY_ISIN: dict[str, ETFEntry] = {etf["isin"]: etf for etf in ETF_CATALOG}
