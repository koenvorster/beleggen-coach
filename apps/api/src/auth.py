"""Keycloak JWT verificatie dependencies voor FastAPI."""
import structlog
import time
import uuid
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import settings

logger = structlog.get_logger(__name__)

_bearer = HTTPBearer(auto_error=False)

# Sentinel voor dev-mode wanneer AUTH_ENABLED=false
DEV_USER_ID = "dev-user-00000000"

# Module-level JWKS-cache met 10 minuten TTL
_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}


async def _get_jwks() -> list:
    """Haal JWKS op van Keycloak met een cache van 10 minuten.

    Returns:
        Lijst van JWK-sleutels van de Keycloak-realm.
    """
    if time.time() - _jwks_cache["fetched_at"] < 600 and _jwks_cache["keys"]:
        return _jwks_cache["keys"]

    async with httpx.AsyncClient() as client:
        oidc_resp = await client.get(
            f"{settings.keycloak_issuer}/.well-known/openid-configuration",
            timeout=10,
        )
        oidc_resp.raise_for_status()
        jwks_uri = oidc_resp.json()["jwks_uri"]

        jwks_resp = await client.get(jwks_uri, timeout=10)
        jwks_resp.raise_for_status()
        _jwks_cache["keys"] = jwks_resp.json()["keys"]
        _jwks_cache["fetched_at"] = time.time()

    return _jwks_cache["keys"]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str:
    """Verifieer Keycloak JWT en retourneer de user_id (sub claim).

    Wanneer AUTH_ENABLED=false, wordt de vaste dev-gebruiker teruggegeven
    zonder enige tokencontrole.

    Args:
        credentials: Bearer token uit de Authorization-header.

    Returns:
        user_id: De Keycloak-gebruikers-UUID (sub claim uit het JWT).

    Raises:
        HTTPException 401: Als de token ontbreekt of ongeldig is.
    """
    if not settings.auth_enabled:
        return DEV_USER_ID

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geen geldige authenticatietoken.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        keys = await _get_jwks()
        payload = jwt.decode(
            token,
            {"keys": keys},
            algorithms=["RS256"],
            audience=settings.keycloak_client_id,
            issuer=settings.keycloak_issuer,
        )
        return payload["sub"]
    except JWTError as exc:
        logger.warning("JWT verificatie mislukt: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geen geldige authenticatietoken.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str | None:
    """Zoals get_current_user, maar geeft None terug als er geen token is.

    Geschikt voor routes die ook zonder authenticatie werken.

    Args:
        credentials: Bearer token uit de Authorization-header (optioneel).

    Returns:
        user_id als de token geldig is, anders None.
    """
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def verify_ownership(jwt_user_id: str, url_user_id: uuid.UUID) -> None:
    """Controleer of de ingelogde gebruiker eigenaar is van het gevraagde resource.

    In dev-mode (AUTH_ENABLED=false) wordt de controle altijd overgeslagen.

    Args:
        jwt_user_id: User-ID uit het JWT (sub claim).
        url_user_id: User-UUID uit de URL-parameter.

    Raises:
        HTTPException 403: Als de gebruiker niet de eigenaar is.
    """
    if not settings.auth_enabled:
        return
    if jwt_user_id != str(url_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Toegang geweigerd.",
        )


# Backward-compatible type alias (behoudt bestaande API surface)
CurrentUser = Annotated[str, Depends(get_current_user)]
