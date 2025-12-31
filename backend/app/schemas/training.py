from typing import List, Optional
from pydantic import BaseModel
from datetime import date, time

# --- Subdivisions ---
class TrainingSubdivisionBase(BaseModel):
    order: int
    type: str
    reps: int
    distance: float
    style: str
    interval_time: Optional[str] = None
    pause_time: Optional[str] = None
    da_re: Optional[float] = None
    da_er: Optional[float] = None
    observation: Optional[str] = None

class TrainingSubdivisionCreate(TrainingSubdivisionBase):
    pass

class TrainingSubdivision(TrainingSubdivisionBase):
    id: int
    series_id: int
    class Config:
        from_attributes = True

# --- Series ---
class TrainingSeriesBase(BaseModel):
    order: int
    name: str
    reps: str
    rpe_target: Optional[float] = None
    instructions: Optional[str] = None
    total_distance: float = 0.0

class TrainingSeriesCreate(TrainingSeriesBase):
    subdivisions: List[TrainingSubdivisionCreate] = []

class TrainingSeries(TrainingSeriesBase):
    id: int
    session_id: int
    subdivisions: List[TrainingSubdivision] = []
    class Config:
        from_attributes = True

# --- Session (Workout) ---
class TrainingSessionBase(BaseModel):
    date: date
    time: Optional[time] = None
    category: Optional[str] = None
    micro_cycle_id: Optional[int] = None
    status: Optional[str] = "Planned"
    description: Optional[str] = None
    total_volume: Optional[float] = 0.0

class TrainingSessionCreate(TrainingSessionBase):
    series: List[TrainingSeriesCreate] = []

class TrainingSessionUpdate(TrainingSessionBase):
    pass

class TrainingSession(TrainingSessionBase):
    id: int
    series: List[TrainingSeries] = []
    class Config:
        from_attributes = True

# --- Live Feedback ---
class SessionFeedbackCreate(BaseModel):
    session_id: int
    athlete_id: int
    rpe_real: Optional[float] = None
    exhaustion_level: Optional[str] = None
    notes: Optional[str] = None
    attendance: str

class SessionFeedback(SessionFeedbackCreate):
    id: int
    class Config:
        from_attributes = True
