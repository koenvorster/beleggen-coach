"""Keycloak JWT verificatie dependency voor FastAPI."""
import logging
from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _get_oidc_config_uri() -> str:
    return f"{settings.keycloak_issuer}/.well-known/openid-configuration"


async def _fetch_jwks() -> dict:
    """Haal JWKS op van Keycloak."""
    async with httpx.AsyncClient() as client:
        oidc_resp = await client.get(_get_oidc_config_uri(), timeout=10)
        oidc_resp.raise_for_status()
        jwks_uri = oidc_resp.json()["jwks_uri"]
        jwks_resp = await client.get(jwks_uri, timeout=10)
        jwks_resp.raise_for_status()
        return jwks_resp.json()


async def verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    """Verifieer Keycloak JWT en retourneer claims.

    Args:
        credentials: Bearer token uit Authorization header.

    Returns:
        JWT claims dict met sub, email, preferred_username etc.

    Raises:
        HTTPException 401: Als token ontbreekt of ongeldig is.
    """
    if not settings.auth_enabled:
        return {"sub": "dev-user", "email": "dev@beleggencoach.be", "preferred_username": "dev"}

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geen authenticatie token meegegeven.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        jwks = await _fetch_jwks()
        claims = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.keycloak_client_id,
            issuer=settings.keycloak_issuer,
        )
        return claims
    except JWTError as exc:
        logger.warning("JWT verificatie mislukt: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ongeldig of verlopen token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


CurrentUser = Annotated[dict, Depends(verify_token)]
