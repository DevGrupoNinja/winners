from sqlalchemy import Column, Integer, String, Date, Float, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class CycleIntensity(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class MacroCycle(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    season = Column(String)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    model = Column(String, nullable=True) # e.g., "ATR", "Traditional"
    architecture = Column(String, nullable=True)

    mesos = relationship("MesoCycle", back_populates="macro", cascade="all, delete-orphan")

class MesoCycle(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    macro_id = Column(Integer, ForeignKey("macrocycle.id"), nullable=False)

    macro = relationship("MacroCycle", back_populates="mesos")
    micros = relationship("MicroCycle", back_populates="meso", cascade="all, delete-orphan")

class MicroCycle(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    focus = Column(String, nullable=True) # Stored as comma-separated string or simple text
    volume = Column(Float, default=0.0) # Planned/Aggregated volume
    intensity = Column(String) # CycleIntensity enum value
    meso_id = Column(Integer, ForeignKey("mesocycle.id"), nullable=False)

    meso = relationship("MesoCycle", back_populates="micros")
