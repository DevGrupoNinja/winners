from sqlalchemy import Column, Integer, String, Date, Float, Enum, ForeignKey, Time, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# --- Configurations ---

class ConfigCategory(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

class ConfigExerciseType(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

class ConfigIntensityInterval(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # e.g. "A1", "A2"
    min_value = Column(Float) # Comparison against DA-RE/DA-ER
    max_value = Column(Float)

# --- Training Structure ---

class TrainingSession(Base):
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=True)
    category = Column(String) # Could be FK to ConfigCategory, but keeping string for flexibility if config deleted
    micro_cycle_id = Column(Integer, ForeignKey("microcycle.id"), nullable=True) # Optional link to periodization
    status = Column(String, default="Planned") # Planned, Completed
    description = Column(Text, nullable=True)
    
    # Aggregated metrics
    total_volume = Column(Float, default=0.0)

    series = relationship("TrainingSeries", back_populates="session", cascade="all, delete-orphan")

class TrainingSeries(Base):
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("trainingsession.id"), nullable=False)
    order = Column(Integer) # To maintain sequence 1, 2, 3...
    
    name = Column(String) # e.g. "Warm up"
    reps = Column(String) # e.g. "2x" or "1x"
    rpe_target = Column(Float, nullable=True)
    instructions = Column(Text, nullable=True)
    total_distance = Column(Float, default=0.0)

    session = relationship("TrainingSession", back_populates="series")
    subdivisions = relationship("TrainingSubdivision", back_populates="series", cascade="all, delete-orphan")

class TrainingSubdivision(Base):
    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(Integer, ForeignKey("trainingseries.id"), nullable=False)
    order = Column(Integer)
    
    type = Column(String) # DDR or DCR
    reps = Column(Integer)
    distance = Column(Float)
    style = Column(String) # Drill/Style
    
    interval_time = Column(String, nullable=True) # "1:30"
    pause_time = Column(String, nullable=True) # "15s"
    
    da_re = Column(Float, nullable=True)
    da_er = Column(Float, nullable=True)
    observation = Column(Text, nullable=True)

    series = relationship("TrainingSeries", back_populates="subdivisions")
    
# --- Live Execution / History ---
# Storing individual feedback per athlete for a session
class SessionFeedback(Base):
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("trainingsession.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("athlete.id"), nullable=False)
    
    rpe_real = Column(Float, nullable=True)
    exhaustion_level = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    attendance = Column(String) # "Present", "Absent"
