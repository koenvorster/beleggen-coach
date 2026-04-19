"""SQLAlchemy ORM-modellen voor investor-profile-mcp."""
from sqlalchemy import String, Integer, Numeric, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    naam: Mapped[str] = mapped_column(String(255), nullable=False)
    taal: Mapped[str] = mapped_column(String(5), nullable=False, default="nl")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["InvestorProfile"] = relationship("InvestorProfile", back_populates="user", uselist=False)


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
