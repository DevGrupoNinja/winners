from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import date

# --- Assessment ---

class AssessmentBase(BaseModel):
    date: date
    weight: Optional[float] = None
    height: Optional[float] = None
    jump_height: Optional[float] = None
    throw_distance: Optional[float] = None
    additional_metrics: Dict[str, Any] = {}
    observation: Optional[str] = None

class AssessmentCreate(AssessmentBase):
    athlete_id: int

class Assessment(AssessmentBase):
    id: int
    athlete_id: int
    class Config:
        from_attributes = True

# --- Wellness ---

class WellnessBase(BaseModel):
    date: date
    sleep_quality: Optional[int] = None
    fatigue_level: Optional[int] = None
    muscle_soreness: Optional[int] = None
    stress_level: Optional[int] = None
    notes: Optional[str] = None

class WellnessCreate(WellnessBase):
    athlete_id: int

class Wellness(WellnessBase):
    id: int
    athlete_id: int
    overall_score: Optional[float] = None
    class Config:
        from_attributes = True
