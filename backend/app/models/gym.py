from sqlalchemy import Column, Integer, String, Date, Float, Enum, ForeignKey, Time, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# --- Templates (Fichas) ---

class GymTemplate(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String) # e.g. "Infantil - Força"
    
    # Store list of exercises. Since structure varies, managing children via relationship is cleaner
    exercises = relationship("GymExercise", back_populates="template", cascade="all, delete-orphan")

class GymExercise(Base):
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("gymtemplate.id"), nullable=False)
    
    name = Column(String)
    muscle_group = Column(String, nullable=True) # Físico-Motriz capacity?
    sets = Column(Integer)
    reps = Column(String) # "12", "12-15", "Failure"
    rest_time = Column(String, nullable=True) # "60s"
    
    # "Meta Relativa": JSON array of load percentages as numbers
    # e.g., [50, 60, 70] meaning 50%, 60%, 70% of body weight
    relative_load_meta = Column(JSON, default=[]) 
    
    observation = Column(Text, nullable=True)
    
    template = relationship("GymTemplate", back_populates="exercises")

# --- Sessions (Execution) ---

class GymSession(Base):
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=True)
    title = Column(String) # e.g. "Treino A"
    
    # If copied from a template, we can keep reference or just copy structure
    # Copying structure to a snapshot is safer for history preservation
    template_snapshot_id = Column(Integer, ForeignKey("gymtemplate.id"), nullable=True) 
    
    # Self-referential FK for Cloning (Workout -> Session)
    parent_session_id = Column(Integer, ForeignKey("gymsession.id", ondelete="SET NULL"), nullable=True)
    parent_session = relationship("GymSession", remote_side=[id], backref="copies")

    status = Column(String, default="Planned") # Planned, Completed
    category = Column(String, default="Geral")
    
    @property
    def exercises(self):
        return self.exercises_snapshot
    
    # Snapshot of exercises at the time of session creation to preserve history
    # List of GymExercise dicts
    exercises_snapshot = Column(JSON, default=[])

    feedbacks = relationship("GymFeedback", back_populates="session", cascade="all, delete-orphan")

class GymFeedback(Base):
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("gymsession.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("athlete.id"), nullable=False)
    
    # Recorded loads for each exercise/set
    # JSON structure: { "ExerciseName": [10, 12, 15], "AnotherEx": [50, 50, 50] }
    performed_loads = Column(JSON, default={})
    
    notes = Column(Text, nullable=True)
    attendance = Column(String) # Present, Absent

    session = relationship("GymSession", back_populates="feedbacks")
