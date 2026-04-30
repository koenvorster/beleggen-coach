"""ORM-modellen voor de API."""
from sqlalchemy import String, Integer, Numeric, Boolean, Text, DateTime, Date, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import datetime
from .database import Base


class ETF(Base):
    """ETF-product met alle relevante metagegevens."""

    __tablename__ = "etfs"

    isin: Mapped[str] = mapped_column(String(12), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    ter: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    risk_level: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="EUR")
    benchmark: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fund_size_m: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    ytd_return: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    one_year_return: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    three_year_return: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    inception_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    is_accumulating: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    replication_method: Mapped[str] = mapped_column(String(20), nullable=False, server_default="physical")
    domicile: Mapped[str] = mapped_column(String(2), nullable=False, server_default="IE")


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    naam: Mapped[str] = mapped_column(String(255), nullable=False)
    taal: Mapped[str] = mapped_column(String(5), nullable=False, default="nl")
    keycloak_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["InvestorProfile"]= relationship("InvestorProfile", back_populates="user", uselist=False)
    plans: Mapped[list["Plan"]] = relationship("Plan", back_populates="user")
    checkins: Mapped[list["CheckIn"]] = relationship("CheckIn", back_populates="user")
    positions: Mapped[list["PortfolioPosition"]] = relationship("PortfolioPosition", back_populates="user")


class InvestorProfile(Base):
    __tablename__ = "investor_profiles"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    goal_type: Mapped[str] = mapped_column(String(50), nullable=False)
    goal_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    horizon_years: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_budget: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    emergency_fund_ready: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    risk_tolerance: Mapped[str] = mapped_column(String(20), nullable=False)
    experience_level: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="profile")


class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    monthly_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    allocation: Mapped[dict] = mapped_column(JSONB, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    risk_notes: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="plans")


class CheckIn(Base):
    __tablename__ = "checkins"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False)
    invested: Mapped[bool] = mapped_column(Boolean, nullable=False)
    emotional_state: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    coach_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "month", name="uq_checkin_user_month"),)
    user: Mapped["User"] = relationship("User", back_populates="checkins")


class PortfolioPosition(Base):
    __tablename__ = "portfolio_positions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    etf_isin: Mapped[str] = mapped_column(String(20), nullable=False)
    etf_ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    shares: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False)
    buy_price_eur: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    buy_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="positions")


# ─── FASE 13: Analytics Database ────────────────────────────────────────────

class ETFPrice(Base):
    """Dagelijkse ETF-koersen (yfinance historische data)."""
    __tablename__ = "etf_prices"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    etf_isin: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    open: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    high: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    low: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    close: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    volume: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (UniqueConstraint("etf_isin", "date", name="uq_etf_price_date"),)


class ETFMetrics(Base):
    """Berekende performance metrics (1M, 3M, YTD, 1Y, 3Y, 5Y)."""
    __tablename__ = "etf_metrics"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    etf_isin: Mapped[str] = mapped_column(String(12), nullable=False, unique=True, index=True)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    
    # Returns (%)
    return_1m: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    return_3m: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    return_ytd: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    return_1y: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    return_3y: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    return_5y: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    
    # Risk metrics
    volatility_1y: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    volatility_3y: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    max_drawdown_1y: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    sharpe_ratio_1y: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FearGreedIndex(Base):
    """Fear & Greed Index (dagelijks: berekend uit VIX + momentum)."""
    __tablename__ = "fear_greed_index"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False, unique=True, index=True)
    
    # Score: 0 = extreme fear, 50 = neutral, 100 = extreme greed
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Components
    vix_level: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    momentum: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PlatformStats(Base):
    """Anonieme platform statistieken (dagelijks snapshot)."""
    __tablename__ = "platform_stats"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False, unique=True, index=True)
    
    # User stats
    total_users: Mapped[int] = mapped_column(Integer, nullable=False)
    active_users: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Behavior stats
    avg_monthly_investment: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    avg_investment_horizon_years: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    avg_streak_days: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Popular ETFs (top 5 ISINs as JSON)
    top_etf_isins: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
