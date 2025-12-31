from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Assessment(Base):
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athlete.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    # Physical Metrics
    weight = Column(Float, nullable=True) # kg
    height = Column(Float, nullable=True) # cm (optional update)
    jump_height = Column(Float, nullable=True) # cm
    throw_distance = Column(Float, nullable=True) # meters
    
    # Flexible field for future metrics
    additional_metrics = Column(JSON, default={}) 
    
    observation = Column(String, nullable=True)

class Wellness(Base):
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athlete.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    # Scores 1-10 or 1-5
    sleep_quality = Column(Integer, nullable=True)
    fatigue_level = Column(Integer, nullable=True)
    muscle_soreness = Column(Integer, nullable=True)
    stress_level = Column(Integer, nullable=True)
    
    # Computed average or total score
    overall_score = Column(Float, nullable=True)
    
    notes = Column(String, nullable=True)
