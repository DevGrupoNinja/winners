from pydantic import BaseModel
from typing import Optional

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
    ddr_explosive: float
    ddr_resistance: float
    ddr_fast: float
    dcr_max: float
    dcr_resistive: float

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

class FunctionalDirection(BaseModel):
    aero: int = 0
    aero_ana: int = 0
    vo2: int = 0
    aa: int = 0
    res_ana: int = 0
    tol_ana: int = 0
    pot_ana: int = 0
    for_rap: int = 0
    for_exp: int = 0
    perna: int = 0
    braco: int = 0
    recup: int = 0

class MacroDashboardResponse(BaseModel):
    swimming: SwimmingDashboard
    gym: GymDashboard
    athletes: AthletesDashboard
    wellness: WellnessDashboard
    results: dict = {}

class MesoDashboardResponse(BaseModel):
    swimming: SwimmingDashboard
    gym: GymDetailedDashboard
    athletes: AthletesDashboard
    wellness: WellnessDashboard
    functional_direction: FunctionalDirection

class MicroDashboardResponse(BaseModel):
    swimming: SwimmingDashboard
    gym: GymDashboard
    athletes: AthletesDashboard
    wellness: WellnessDashboard
    functional_direction: FunctionalDirection
    relative_load: Optional[float] = None
