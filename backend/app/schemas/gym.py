from typing import List, Optional, Any, Dict
from pydantic import BaseModel, field_validator
from datetime import date, time

# --- Exercises ---

class GymExerciseBase(BaseModel):
    name: str
    muscle_group: Optional[str] = None
    sets: int
    reps: str
    rest_time: Optional[str] = None
    relative_load_meta: List[float] = []  # List of load percentages as numbers (e.g., [50, 60, 70])
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
    time: Optional[str] = None  # Store as string "HH:MM" format
    title: str
    category: Optional[str] = "Geral"
    template_snapshot_id: Optional[int] = None
    parent_session_id: Optional[int] = None
    status: Optional[str] = "Planned"
    exercises: List[GymExerciseBase] = [] # Snapshot of exercises

class GymSessionCreate(GymSessionBase):
    pass

class GymSessionStart(BaseModel):
    time: Optional[str] = None  # Accept string format like "HH:MM"

class GymSession(GymSessionBase):
    id: int
    parent_session_id: Optional[int] = None
    feedbacks: List[GymFeedback] = []
    
    class Config:
        from_attributes = True
    
    @field_validator('time', mode='before')
    @classmethod
    def convert_time_to_str(cls, v):
        if v is None:
            return None
        if hasattr(v, 'strftime'):
            return v.strftime("%H:%M")
        return str(v) if v else None
