import datetime
from pydantic import BaseModel

# --- Configuration ---
class ConfigFunctionalDirectionRangeBase(BaseModel):
    re_min: float
    re_max: float
    er_min: float
    er_max: float
    direction: str

class ConfigFunctionalDirectionRangeCreate(ConfigFunctionalDirectionRangeBase):
    pass

class ConfigFunctionalDirectionRange(ConfigFunctionalDirectionRangeBase):
    id: int
    class Config:
        from_attributes = True

# --- Subdivisions ---
class TrainingSubdivisionBase(BaseModel):
    order: int
    type: str
    reps: int
    distance: float
    style: str
    interval_time: str | None = None
    pause_time: str | None = None
    da_re: float | None = None
    da_er: float | None = None
    functional_base: str | None = None
    observation: str | None = None

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
    rpe_target: float | None = None
    rpe_description: str | None = None
    instructions: str | None = None
    total_distance: float = 0.0

class TrainingSeriesCreate(TrainingSeriesBase):
    subdivisions: list["TrainingSubdivisionCreate"] = []

class TrainingSeries(TrainingSeriesBase):
    id: int
    session_id: int
    subdivisions: list["TrainingSubdivision"] = []
    class Config:
        from_attributes = True

# --- Session (Workout) ---
class TrainingSessionBase(BaseModel):
    date: datetime.date
    time: datetime.time | None = None
    profile: str | None = None
    category: str | None = None
    micro_cycle_id: int | None = None
    status: str | None = "Planned"
    description: str | None = None
    total_volume: float | None = 0.0

class TrainingSessionCreate(TrainingSessionBase):
    series: list["TrainingSeriesCreate"] = []

class TrainingSessionUpdate(BaseModel):
    date: datetime.date | None = None
    time: datetime.time | None = None
    profile: str | None = None
    category: str | None = None
    micro_cycle_id: int | None = None
    status: str | None = None
    description: str | None = None
    total_volume: float | None = None
    series: list["TrainingSeriesCreate"] | None = None

class TrainingSession(TrainingSessionBase):
    id: int
    parent_session_id: int | None = None
    series: list["TrainingSeries"] = []
    feedbacks: list["SessionFeedback"] = []
    class Config:
        from_attributes = True

# --- Live Feedback ---
class SessionFeedbackCreate(BaseModel):
    session_id: int
    athlete_id: int
    rpe_real: float | None = None
    exhaustion_level: str | None = None
    notes: str | None = None
    attendance: str

class SessionFeedback(SessionFeedbackCreate):
    id: int
    class Config:
        from_attributes = True
