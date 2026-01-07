from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, athletes, cycles, training, gym, analytics, cycles_dashboard, home_dashboard

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(athletes.router, prefix="/athletes", tags=["athletes"])
api_router.include_router(cycles.router, prefix="/cycles", tags=["cycles"])
api_router.include_router(cycles_dashboard.router, prefix="/cycles", tags=["cycles-dashboard"])
api_router.include_router(training.router, prefix="/training", tags=["training"])
api_router.include_router(gym.router, prefix="/gym", tags=["gym"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(home_dashboard.router, prefix="/home", tags=["home"])
