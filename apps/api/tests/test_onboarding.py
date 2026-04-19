"""Tests voor de onboarding router."""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
import uuid

from src.main import app
from src.schemas import UserResponse, InvestorProfileResponse


MOCK_USER_ID = uuid.uuid4()
MOCK_PROFILE_ID = uuid.uuid4()


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = MOCK_USER_ID
    user.email = "test@example.com"
    user.naam = "Test Gebruiker"
    user.taal = "nl"
    return user


@pytest.fixture
def mock_profile(mock_user):
    profile = MagicMock()
    profile.id = MOCK_PROFILE_ID
    profile.user_id = MOCK_USER_ID
    profile.goal_type = "pensioen"
    profile.horizon_years = 20
    profile.monthly_budget = 200.0
    profile.risk_tolerance = "matig"
    profile.experience_level = "geen"
    profile.emergency_fund_ready = True
    return profile


@pytest.mark.asyncio
async def test_onboarding_start(mock_user):
    with patch("src.routers.onboarding.create_or_get_user", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = (mock_user, True)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/onboarding/start", json={
                "email": "test@example.com",
                "naam": "Test Gebruiker",
                "taal": "nl",
            })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_onboarding_profile(mock_profile):
    with patch("src.routers.onboarding.save_investor_profile", new_callable=AsyncMock) as mock_save:
        mock_save.return_value = mock_profile
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.put(f"/api/v1/onboarding/{MOCK_USER_ID}/profile", json={
                "goal_type": "pensioen",
                "horizon_years": 20,
                "monthly_budget": 200.0,
                "emergency_fund_ready": True,
                "risk_tolerance": "matig",
                "experience_level": "geen",
            })
    assert response.status_code == 200
    data = response.json()
    assert data["goal_type"] == "pensioen"


@pytest.mark.asyncio
async def test_onboarding_summary_not_found():
    with patch("src.routers.onboarding.get_onboarding_summary", new_callable=AsyncMock) as mock_summary:
        mock_summary.return_value = None
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"/api/v1/onboarding/{MOCK_USER_ID}/summary")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
