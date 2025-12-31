from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import date

class AthleteBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    cpf: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    category: Optional[str] = None
    status: Optional[str] = "Active"
    avatar_url: Optional[str] = None

class AthleteCreate(AthleteBase):
    first_name: str
    last_name: str
    cpf: str
    email: EmailStr
    birth_date: date
    category: str

class AthleteUpdate(AthleteBase):
    pass

class AthleteInDBBase(AthleteBase):
    id: int
    name: Optional[str] = None
    recent_load: float = 0.0
    fatigue_score: float = 0.0
    body_weight: float = 0.0

    class Config:
        from_attributes = True

class Athlete(AthleteInDBBase):
    pass
