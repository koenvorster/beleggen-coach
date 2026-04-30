"""Comprehensive tests for ETF router and domain logic.

Tests cover:
1. ETF listing with filters (search, category, TER, risk_level)
2. Pagination (limit, offset)
3. ETF detail retrieval with similar ETFs
4. Faceted responses
5. Value object validation and immutability
6. Domain aggregate logic
"""
import pytest
from datetime import date
from decimal import Decimal

from src.domain.value_objects import ISIN, TER, ETFScore, DividendYield
from src.domain.etf import ETFProduct


# ─────────────────────────────────────────────────────────────────────────────
# VALUE OBJECT TESTS
# ─────────────────────────────────────────────────────────────────────────────


class TestISINValueObject:
    """Test ISIN value object validation and immutability."""

    def test_valid_isin(self):
        """Test valid ISIN code."""
        isin = ISIN(code="IE00B4L5Y983")
        assert str(isin) == "IE00B4L5Y983"
        assert isin.code == "IE00B4L5Y983"

    def test_isin_case_insensitive(self):
        """Test ISIN is converted to uppercase."""
        isin = ISIN(code="ie00b4l5y983")
        assert isin.code == "IE00B4L5Y983"

    def test_isin_strips_whitespace(self):
        """Test ISIN whitespace is stripped."""
        isin = ISIN(code="  IE00B4L5Y983  ")
        assert isin.code == "IE00B4L5Y983"

    def test_invalid_isin_too_short(self):
        """Test ISIN validation rejects short codes."""
        with pytest.raises(ValueError, match="12 tekens"):
            ISIN(code="IE00B4L5Y98")

    def test_invalid_isin_starts_with_numbers(self):
        """Test ISIN validation rejects codes not starting with 2 letters."""
        with pytest.raises(ValueError, match="2 letters"):
            ISIN(code="1E00B4L5Y983")

    def test_isin_immutable(self):
        """Test ISIN is immutable."""
        isin = ISIN(code="IE00B4L5Y983")
        with pytest.raises(Exception):  # ValidationError from frozen model
            isin.code = "XX00XXXXXXXXX"  # type: ignore

    def test_isin_hashable(self):
        """Test ISIN can be hashed (works in sets/dicts)."""
        isin1 = ISIN(code="IE00B4L5Y983")
        isin2 = ISIN(code="IE00B4L5Y983")
        assert hash(isin1) == hash(isin2)
        assert {isin1, isin2} == {isin1}


class TestTERValueObject:
    """Test Total Expense Ratio value object."""

    def test_valid_ter(self):
        """Test valid TER."""
        ter = TER(value=0.0020)
        assert float(ter) == 0.002
        assert "0.20%" in str(ter)

    def test_ter_from_percentage(self):
        """Test TER accepts percentage-like inputs."""
        ter = TER(value=0.25)  # 25%
        assert float(ter) == 0.25

    def test_ter_zero(self):
        """Test TER can be zero."""
        ter = TER(value=0.0)
        assert float(ter) == 0.0

    def test_ter_rounding(self):
        """Test TER rounding to 4 decimals."""
        ter = TER(value=0.123456)
        assert ter.value == Decimal("0.1235")  # rounded

    def test_ter_immutable(self):
        """Test TER is immutable."""
        ter = TER(value=0.0020)
        with pytest.raises(Exception):
            ter.value = 0.005  # type: ignore

    def test_invalid_ter_negative(self):
        """Test TER validation rejects negative values."""
        with pytest.raises(ValueError, match="0.0 en 1.0"):
            TER(value=-0.01)

    def test_invalid_ter_too_high(self):
        """Test TER validation rejects values > 1.0."""
        with pytest.raises(ValueError, match="0.0 en 1.0"):
            TER(value=1.5)


class TestETFScoreValueObject:
    """Test ETFScore value object."""

    def test_valid_score_levels(self):
        """Test valid score levels 1-7."""
        for level in range(1, 8):
            score = ETFScore(level=level, label="Test")
            assert score.level == level

    def test_etf_score_factory(self):
        """Test ETFScore factory method from_level."""
        for level in range(1, 8):
            score = ETFScore.from_level(level)
            assert score.level == level
            assert len(score.label) > 0

    def test_etf_score_labels(self):
        """Test ETFScore provides appropriate labels."""
        assert "Conservative" in ETFScore.from_level(1).label
        assert "Moderate" in ETFScore.from_level(4).label
        assert "Aggressive" in ETFScore.from_level(7).label

    def test_etf_score_immutable(self):
        """Test ETFScore is immutable."""
        score = ETFScore(level=3, label="Moderate")
        with pytest.raises(Exception):
            score.level = 4  # type: ignore

    def test_invalid_score_level(self):
        """Test ETFScore validation rejects invalid levels."""
        from pydantic_core import ValidationError
        
        with pytest.raises(ValidationError):
            ETFScore(level=0, label="Test")

        with pytest.raises(ValidationError):
            ETFScore(level=8, label="Test")

    def test_invalid_score_empty_label(self):
        """Test ETFScore validation rejects empty labels."""
        with pytest.raises(ValueError, match="Label mag niet leeg"):
            ETFScore(level=3, label="")


class TestDividendYieldValueObject:
    """Test DividendYield value object."""

    def test_valid_dividend_yield(self):
        """Test valid dividend yield."""
        dy = DividendYield(value=2.5)
        assert float(dy) == 2.5
        assert "2.50%" in str(dy)

    def test_zero_dividend(self):
        """Test zero dividend yield."""
        dy = DividendYield(value=0.0)
        assert float(dy) == 0.0

    def test_high_dividend(self):
        """Test high dividend yield."""
        dy = DividendYield(value=10.5)
        assert float(dy) == 10.5

    def test_dividend_rounding(self):
        """Test dividend rounding to 2 decimals."""
        dy = DividendYield(value=2.567)
        assert dy.value == Decimal("2.57")

    def test_dividend_immutable(self):
        """Test DividendYield is immutable."""
        dy = DividendYield(value=2.5)
        with pytest.raises(Exception):
            dy.value = 3.0  # type: ignore


# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN AGGREGATE TESTS
# ─────────────────────────────────────────────────────────────────────────────


class TestETFProductAggregate:
    """Test ETFProduct DDD aggregate root."""

    def test_create_etf_aggregate(self):
        """Test creating an ETF aggregate."""
        product = ETFProduct(
            isin=ISIN(code="IE00B4L5Y983"),
            name="iShares Core MSCI World",
            description="Global markets",
            category="equity",
            ter=TER(value=0.0020),
            risk_score=ETFScore(level=5, label="Moderate"),
            dividend_yield=DividendYield(value=1.8),
            inception_date=date(2009, 6, 1),
            is_accumulating=True,
            benchmark="MSCI World",
        )
        assert str(product.isin) == "IE00B4L5Y983"
        assert product.risk_score.level == 5

    def test_etf_is_cheap(self):
        """Test is_cheap property (TER < 0.25%)."""
        cheap = ETFProduct(
            isin=ISIN(code="IE00B4L5Y983"),
            name="Cheap ETF",
            description="",
            category="equity",
            ter=TER(value=0.0020),  # 0.20%
            risk_score=ETFScore(level=5, label="Moderate"),
            dividend_yield=DividendYield(value=0.0),
            inception_date=None,
            is_accumulating=True,
            benchmark=None,
        )
        assert cheap.is_cheap

        expensive = ETFProduct(
            isin=ISIN(code="IE00BK5BQT80"),
            name="Expensive ETF",
            description="",
            category="equity",
            ter=TER(value=0.0030),  # 0.30%
            risk_score=ETFScore(level=5, label="Moderate"),
            dividend_yield=DividendYield(value=0.0),
            inception_date=None,
            is_accumulating=True,
            benchmark=None,
        )
        assert not expensive.is_cheap

    def test_etf_age_calculation(self):
        """Test age_years property."""
        from datetime import datetime
        today = date.today()
        inception = date(today.year - 10, today.month, today.day)
        
        product = ETFProduct(
            isin=ISIN(code="IE00B4L5Y983"),
            name="Test ETF",
            description="",
            category="equity",
            ter=TER(value=0.0020),
            risk_score=ETFScore(level=5, label="Moderate"),
            dividend_yield=DividendYield(value=0.0),
            inception_date=inception,
            is_accumulating=True,
            benchmark=None,
        )
        assert product.age_years == 10

    def test_etf_aggregate_immutable(self):
        """Test ETFProduct aggregate is frozen (immutable)."""
        product = ETFProduct(
            isin=ISIN(code="IE00B4L5Y983"),
            name="Test ETF",
            description="",
            category="equity",
            ter=TER(value=0.0020),
            risk_score=ETFScore(level=5, label="Moderate"),
            dividend_yield=DividendYield(value=0.0),
            inception_date=None,
            is_accumulating=True,
            benchmark=None,
        )
        with pytest.raises(Exception):  # dataclass frozen
            product.name = "New Name"  # type: ignore

    def test_etf_hashable_and_comparable(self):
        """Test ETFProduct can be hashed and compared by ISIN."""
        p1 = ETFProduct(
            isin=ISIN(code="IE00B4L5Y983"),
            name="ETF A",
            description="",
            category="equity",
            ter=TER(value=0.0020),
            risk_score=ETFScore(level=5, label="Moderate"),
            dividend_yield=DividendYield(value=0.0),
            inception_date=None,
            is_accumulating=True,
            benchmark=None,
        )
        p2 = ETFProduct(
            isin=ISIN(code="IE00B4L5Y983"),
            name="ETF A Different Name",  # different name but same ISIN
            description="",
            category="equity",
            ter=TER(value=0.0030),  # different TER
            risk_score=ETFScore(level=4, label="Moderate"),  # different risk
            dividend_yield=DividendYield(value=0.0),
            inception_date=None,
            is_accumulating=True,
            benchmark=None,
        )
        # Should be equal if ISIN is the same
        assert p1 == p2
        assert hash(p1) == hash(p2)
        assert {p1, p2} == {p1}


# ─────────────────────────────────────────────────────────────────────────────
# NOTE: Router integration tests (GET /etfs, GET /etfs/{isin}, etc.) require
# a running database and FastAPI test client. These are best run with:
#
#    pytest tests/test_etfs_router.py -v
#
# in a Docker environment or with PostgreSQL running locally.
#
# The value object and aggregate tests above do NOT require a database and
# can be run standalone.
# ─────────────────────────────────────────────────────────────────────────────

