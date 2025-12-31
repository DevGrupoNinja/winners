from typing import List, Optional
from pydantic import BaseModel
from datetime import date

# MicroCycle
class MicroCycleBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    focus: Optional[str] = None
    volume: Optional[float] = 0.0
    intensity: Optional[str] = "Medium"

class MicroCycleCreate(MicroCycleBase):
    meso_id: int

class MicroCycleUpdate(MicroCycleBase):
    pass

class MicroCycle(MicroCycleBase):
    id: int
    meso_id: int

    class Config:
        from_attributes = True

# MesoCycle
class MesoCycleBase(BaseModel):
    name: str
    start_date: date
    end_date: date

class MesoCycleCreate(MesoCycleBase):
    macro_id: int

class MesoCycleUpdate(MesoCycleBase):
    pass

class MesoCycle(MesoCycleBase):
    id: int
    macro_id: int
    micros: List[MicroCycle] = []

    class Config:
        from_attributes = True

# MacroCycle
class MacroCycleBase(BaseModel):
    name: str
    season: Optional[str] = None
    start_date: date
    end_date: date
    model: Optional[str] = None
    architecture: Optional[str] = None

class MacroCycleCreate(MacroCycleBase):
    pass

class MacroCycleUpdate(MacroCycleBase):
    pass

class MacroCycle(MacroCycleBase):
    id: int
    mesos: List[MesoCycle] = []

    class Config:
        from_attributes = True
