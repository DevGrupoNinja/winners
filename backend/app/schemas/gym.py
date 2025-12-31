from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import date, time

# --- Exercises ---

class GymExerciseBase(BaseModel):
    name: str
    muscle_group: Optional[str] = None
    sets: int
    reps: str
    rest_time: Optional[str] = None
    relative_load_meta: List[Any] = [] # List of targets
    observation: Optional[str] = None

class GymExerciseCreate(GymExerciseBase):
    pass

class GymExercise(GymExerciseBase):
    id: int
    template_id: int
    class Config:
        from_attributes = True

# --- Templates ---

class GymTemplateBase(BaseModel):
    title: str
    category: Optional[str] = None

class GymTemplateCreate(GymTemplateBase):
    exercises: List[GymExerciseCreate] = []

class GymTemplate(GymTemplateBase):
    id: int
    exercises: List[GymExercise] = []
    class Config:
        from_attributes = True

# --- Feedback & Sessions ---

class GymFeedbackBase(BaseModel):
    athlete_id: int
    performed_loads: Dict[str, List[float]] = {} # {"Squat": [100, 110]}
    notes: Optional[str] = None
    attendance: str

class GymFeedbackCreate(GymFeedbackBase):
    pass

class GymFeedback(GymFeedbackBase):
    id: int
    session_id: int
    class Config:
        from_attributes = True

class GymSessionBase(BaseModel):
    date: date
    time: Optional[time] = None
    title: str
    template_snapshot_id: Optional[int] = None
    status: Optional[str] = "Planned"

class GymSessionCreate(GymSessionBase):
    pass

class GymSession(GymSessionBase):
    id: int
    feedbacks: List[GymFeedback] = []
    class Config:
        from_attributes = True
