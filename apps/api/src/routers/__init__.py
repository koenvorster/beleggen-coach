from .onboarding import router as onboarding_router
from .ai_router import router as ai_router
from .etfs import router as etfs_router
from .plans import router as plans_router
from .checkins import router as checkins_router
from .portfolio import router as portfolio_router
from .chat_memory import router as chat_memory_router
from .market_data import router as market_data_router
from .analytics import router as analytics_router

__all__ = [
    "onboarding_router",
    "ai_router",
    "etfs_router",
    "plans_router",
    "checkins_router",
    "portfolio_router",
    "chat_memory_router",
    "market_data_router",
    "analytics_router",
]
