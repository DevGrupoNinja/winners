from sqlalchemy import Column, Integer, String, Date, Float, Enum
from app.db.base_class import Base
import enum

class AthleteStatus(str, enum.Enum):
    ACTIVE = "Active"
    BLOCKED = "Blocked"

class AthleteCategory(str, enum.Enum):
    INFANTIL = "Infantil"
    JUVENIL = "Juvenil"
    JUNIOR = "Júnior"
    SENIOR = "Sênior"
    ABSOLUTO = "Absoluto"
    PETIZ = "Petiz"
    MASTER = "Master"
    GERAL = "Geral"

class Athlete(Base):
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    cpf = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String)
    address = Column(String)
    birth_date = Column(Date)
    category = Column(String) # Storing as string to be flexible or strictly Enum if preferred
    status = Column(String, default=AthleteStatus.ACTIVE.value)
    avatar_url = Column(String, nullable=True)
    
    # Computed/Cached fields can be regular columns updated by logic
    recent_load = Column(Float, default=0.0)
    fatigue_score = Column(Float, default=0.0)
    body_weight = Column(Float, default=0.0)

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"


class ConfigAthleteCategory(Base):
    """Configuration table for athlete categories."""
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive (soft delete)
