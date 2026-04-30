"""Analytics routes — backtester, ETF metrics, Fear & Greed, platform stats."""

from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta
from decimal import Decimal
import numpy as np

from ..database import get_db
from ..models import ETFPrice, ETFMetrics, FearGreedIndex, PlatformStats

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/etf-metrics")
async def get_etf_metrics(
    isin: str | None = None,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Haal ETF performance metrics op.
    
    Query params:
      - isin (optional): Specifieke ISIN, of alle als niet gegeven
    
    Returns:
        { success, data: [{ isin, date, return_1m, return_3m, ... }], error }
    """
    try:
        if isin:
            stmt = select(ETFMetrics).where(ETFMetrics.etf_isin == isin)
        else:
            stmt = select(ETFMetrics).order_by(ETFMetrics.etf_isin)
        
        result = await db.execute(stmt)
        metrics = result.scalars().all()
        
        return {
            "success": True,
            "data": [
                {
                    "isin": m.etf_isin,
                    "date": m.date.isoformat(),
                    "return_1m": float(m.return_1m) if m.return_1m else None,
                    "return_3m": float(m.return_3m) if m.return_3m else None,
                    "return_ytd": float(m.return_ytd) if m.return_ytd else None,
                    "return_1y": float(m.return_1y) if m.return_1y else None,
                    "return_3y": float(m.return_3y) if m.return_3y else None,
                    "return_5y": float(m.return_5y) if m.return_5y else None,
                    "volatility_1y": float(m.volatility_1y) if m.volatility_1y else None,
                    "sharpe_ratio_1y": float(m.sharpe_ratio_1y) if m.sharpe_ratio_1y else None,
                    "max_drawdown_1y": float(m.max_drawdown_1y) if m.max_drawdown_1y else None,
                }
                for m in metrics
            ],
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "METRICS_ERROR", "message": str(e)}
        }


@router.get("/fear-greed")
async def get_fear_greed(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Haal Fear & Greed Index op voor afgelopen N dagen.
    
    Query params:
      - days (default 30): Hoeveel dagen terug
    
    Returns:
        { success, data: { current, history: [...] }, error }
    """
    try:
        cutoff_date = datetime.now().date() - timedelta(days=days)
        stmt = select(FearGreedIndex).where(
            FearGreedIndex.date >= cutoff_date
        ).order_by(FearGreedIndex.date)
        
        result = await db.execute(stmt)
        records = result.scalars().all()
        
        current = None
        if records:
            latest = records[-1]
            current = {
                "score": latest.score,
                "label": _fear_greed_label(latest.score),
                "date": latest.date.isoformat()
            }
        
        history = [
            {
                "date": r.date.isoformat(),
                "score": r.score,
                "vix_level": float(r.vix_level) if r.vix_level else None,
                "momentum": float(r.momentum) if r.momentum else None,
            }
            for r in records
        ]
        
        return {
            "success": True,
            "data": {
                "current": current,
                "history": history
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "FEAR_GREED_ERROR", "message": str(e)}
        }


def _fear_greed_label(score: int) -> str:
    """Convert 0-100 score to label."""
    if score < 20:
        return "Extreme Fear"
    elif score < 40:
        return "Fear"
    elif score < 60:
        return "Neutral"
    elif score < 80:
        return "Greed"
    else:
        return "Extreme Greed"


@router.post("/backtester")
async def run_backtester(
    allocation: dict[str, float],
    start_date: str = "2020-01-01",
    end_date: str | None = None,
    dca_monthly: float | None = None,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Run portfolio backtester."""
    try:
        total_weight = sum(allocation.values())
        if abs(total_weight - 1.0) > 0.01:
            return {
                "success": False,
                "data": None,
                "error": {"code": "INVALID_ALLOCATION", "message": f"Weights sum to {total_weight}, expected ~1.0"}
            }
        
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else datetime.now().date()
        
        if start >= end:
            return {
                "success": False,
                "data": None,
                "error": {"code": "INVALID_DATES", "message": "start_date must be before end_date"}
            }
        
        price_data = {}
        for isin in allocation.keys():
            stmt = select(ETFPrice).where(
                and_(
                    ETFPrice.etf_isin == isin,
                    ETFPrice.date >= start,
                    ETFPrice.date <= end
                )
            ).order_by(ETFPrice.date)
            
            result = await db.execute(stmt)
            prices = result.scalars().all()
            
            if not prices:
                return {
                    "success": False,
                    "data": None,
                    "error": {"code": "NO_PRICE_DATA", "message": f"No price data for {isin} in date range"}
                }
            
            price_data[isin] = [(p.date, float(p.close)) for p in prices]
        
        timeline = []
        portfolio_value = dca_monthly if dca_monthly else 1000.0
        current_date = start
        shares = {isin: 0.0 for isin in allocation.keys()}
        
        if not dca_monthly:
            for isin, weight in allocation.items():
                first_price = next((p for d, p in price_data[isin] if d == start), None)
                if first_price:
                    shares[isin] = (portfolio_value * weight) / first_price
        
        for isin, weight in allocation.items():
            for date, price in price_data[isin]:
                if dca_monthly and date != current_date:
                    if date.day == 1 or (date - current_date).days >= 30:
                        for isin_dca, weight_dca in allocation.items():
                            price_dca = next((p for d, p in price_data[isin_dca] if d == date), None)
                            if price_dca:
                                shares[isin_dca] += (dca_monthly * weight_dca) / price_dca
                        current_date = date
                
                value = sum(shares[isin] * price for isin, price in zip(allocation.keys(), [price] * len(allocation)))
                timeline.append({
                    "date": date.isoformat(),
                    "value": round(float(value), 2)
                })
        
        if len(timeline) < 2:
            return {
                "success": False,
                "data": None,
                "error": {"code": "INSUFFICIENT_DATA", "message": "Less than 2 data points"}
            }
        
        values = np.array([t["value"] for t in timeline])
        start_value = values[0]
        end_value = values[-1]
        years = (end - start).days / 365.25
        
        cagr = ((end_value / start_value) ** (1 / years) - 1) * 100 if years > 0 else 0
        
        cummax = np.maximum.accumulate(values)
        drawdown = (values - cummax) / cummax
        max_dd = np.min(drawdown) * 100 if len(drawdown) > 0 else 0
        
        returns = np.diff(values) / values[:-1]
        annual_vol = np.std(returns) * np.sqrt(252) * 100
        sharpe = (cagr / annual_vol) if annual_vol > 0 else 0
        
        return {
            "success": True,
            "data": {
                "cagr": round(cagr, 2),
                "sharpe": round(sharpe, 2),
                "max_drawdown": round(max_dd, 2),
                "start_value": round(start_value, 2),
                "end_value": round(end_value, 2),
                "total_return": round(((end_value - start_value) / start_value) * 100, 2),
                "timeline": timeline
            },
            "error": None
        }
    except ValueError as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "PARSE_ERROR", "message": str(e)}
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "BACKTESTER_ERROR", "message": str(e)}
        }


@router.get("/platform-stats")
async def get_platform_stats(
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Haal anonieme platform statistieken op."""
    try:
        stmt = select(PlatformStats).order_by(PlatformStats.date.desc()).limit(1)
        result = await db.execute(stmt)
        latest = result.scalar()
        
        if not latest:
            return {
                "success": True,
                "data": None,
                "error": None
            }
        
        return {
            "success": True,
            "data": {
                "date": latest.date.isoformat(),
                "total_users": latest.total_users,
                "active_users": latest.active_users,
                "avg_monthly_investment": float(latest.avg_monthly_investment),
                "avg_investment_horizon_years": float(latest.avg_investment_horizon_years),
                "avg_streak_days": latest.avg_streak_days,
                "top_etf_isins": latest.top_etf_isins,
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "STATS_ERROR", "message": str(e)}
        }
