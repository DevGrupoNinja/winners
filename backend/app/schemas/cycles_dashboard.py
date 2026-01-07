from pydantic import BaseModel
from typing import Optional, Dict

class SwimmingDashboard(BaseModel):
    total_volume: float
    total_sessions: int
    average_per_session: float
    ddr_volume: float
    dcr_volume: float

class GymDashboard(BaseModel):
    total_load: float
    total_sessions: int
    average_load: float

class GymDetailedDashboard(GymDashboard):
    ddr_explosive: float  # Força Explosiva
    ddr_explosiva: float  # Explosiva (separate type)
    ddr_resistance: float  # Resistência Força
    ddr_fast: float  # Força Rápida
    dcr_max: float  # Força Máxima
    dcr_resistive: float  # Força Resistiva

class AthletesDashboard(BaseModel):
    improved_count: int
    declined_count: int
    average_attendance: float
    weight_gained_count: Optional[int] = 0
    weight_lost_count: Optional[int] = 0

class WellnessDashboard(BaseModel):
    avg_sleep: Optional[float] = None
    avg_fatigue: Optional[float] = None
    avg_stress: Optional[float] = None
    avg_muscle_soreness: Optional[float] = None

# Dynamic functional direction - keys come from system configuration
FunctionalDirection = Dict[str, int]

class MacroDashboardResponse(BaseModel):
    swimming: SwimmingDashboard
    gym: GymDetailedDashboard
    athletes: AthletesDashboard
    wellness: WellnessDashboard
    results: dict = {}

class MesoDashboardResponse(BaseModel):
    swimming: SwimmingDashboard
    gym: GymDetailedDashboard
    athletes: AthletesDashboard
    wellness: WellnessDashboard
    functional_direction: FunctionalDirection
    target_er: Optional[float] = None  # Average ER from subdivisions
    target_re: Optional[float] = None  # Average RE from subdivisions

class MicroDashboardResponse(BaseModel):
    swimming: SwimmingDashboard
    gym: GymDetailedDashboard
    athletes: AthletesDashboard
    wellness: WellnessDashboard
    functional_direction: FunctionalDirection
    relative_load: Optional[float] = None
