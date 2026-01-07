from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time

class MicroInfo(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date

class MesoInfo(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date

class SessionSummary(BaseModel):
    id: int
    title: str
    time: Optional[str] = None
    status: str
    type: str  # "pool" or "gym"

class HomeDashboardResponse(BaseModel):
    # Indicators
    active_athletes_count: int
    current_micro: Optional[MicroInfo] = None
    week_volume: float  # Total volume in meters
    
    # Planning view
    current_meso: Optional[MesoInfo] = None
    meso_progress: float  # Percentage (0-100)
    ddr_percentage: float
    dcr_percentage: float
    
    # Agenda
    todays_pool_sessions: List[SessionSummary]
    todays_gym_sessions: List[SessionSummary]
