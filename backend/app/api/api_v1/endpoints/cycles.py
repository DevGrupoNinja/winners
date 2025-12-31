from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

# --- Macro Cycle Endpoints ---

@router.get("/macros/", response_model=List[schemas.MacroCycle])
def read_macros(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve macro cycles (including nested mesos/micros).
    """
    return db.query(models.MacroCycle).offset(skip).limit(limit).all()

@router.post("/macros/", response_model=schemas.MacroCycle)
def create_macro(
    *,
    db: Session = Depends(deps.get_db),
    macro_in: schemas.MacroCycleCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new macro cycle.
    """
    # Check for overlaps with other macros
    existing_macros = db.query(models.MacroCycle).all()
    
    for existing in existing_macros:
        # Check if date ranges overlap
        if not (macro_in.end_date < existing.start_date or macro_in.start_date > existing.end_date):
            raise HTTPException(
                status_code=400, 
                detail=f"Macro dates overlap with existing macrocycle '{existing.name}'"
            )
    
    db_obj = models.MacroCycle(**macro_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/macros/{id}", response_model=schemas.MacroCycle)
def delete_macro(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    macro = db.query(models.MacroCycle).filter(models.MacroCycle.id == id).first()
    if not macro:
        raise HTTPException(status_code=404, detail="Macro cycle not found")
    db.delete(macro)
    db.commit()
    return macro

@router.put("/macros/{id}", response_model=schemas.MacroCycle)
def update_macro(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    macro_in: schemas.MacroCycleUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    macro = db.query(models.MacroCycle).filter(models.MacroCycle.id == id).first()
    if not macro:
        raise HTTPException(status_code=404, detail="Macro cycle not found")
    
    update_data = macro_in.dict(exclude_unset=True)
    
    # Get the updated dates or use existing ones
    new_start = update_data.get('start_date', macro.start_date)
    new_end = update_data.get('end_date', macro.end_date)
    
    # Check for overlaps with other macros (excluding itself)
    existing_macros = db.query(models.MacroCycle).filter(
        models.MacroCycle.id != id
    ).all()
    
    for existing in existing_macros:
        if not (new_end < existing.start_date or new_start > existing.end_date):
            raise HTTPException(
                status_code=400, 
                detail=f"Macro dates overlap with existing macrocycle '{existing.name}'"
            )
    
    for field, value in update_data.items():
        setattr(macro, field, value)
    
    db.add(macro)
    db.commit()
    db.refresh(macro)
    return macro


# --- Meso Cycle Endpoints ---

@router.post("/mesos/", response_model=schemas.MesoCycle)
def create_meso(
    *,
    db: Session = Depends(deps.get_db),
    meso_in: schemas.MesoCycleCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new meso cycle.
    """
    # Validation: Check if dates fit in parent macro
    macro = db.query(models.MacroCycle).filter(models.MacroCycle.id == meso_in.macro_id).first()
    if not macro:
        raise HTTPException(status_code=404, detail="Parent macro cycle not found")
    
    if meso_in.start_date < macro.start_date or meso_in.end_date > macro.end_date:
        raise HTTPException(status_code=400, detail="Meso dates must be within Macro dates")
    
    # Check for overlaps with other mesos in the same macro
    existing_mesos = db.query(models.MesoCycle).filter(
        models.MesoCycle.macro_id == meso_in.macro_id
    ).all()
    
    for existing in existing_mesos:
        # Check if date ranges overlap
        if not (meso_in.end_date < existing.start_date or meso_in.start_date > existing.end_date):
            raise HTTPException(
                status_code=400, 
                detail=f"Meso dates overlap with existing mesocycle '{existing.name}'"
            )

    db_obj = models.MesoCycle(**meso_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/mesos/{id}", response_model=schemas.MesoCycle)
def delete_meso(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    meso = db.query(models.MesoCycle).filter(models.MesoCycle.id == id).first()
    if not meso:
        raise HTTPException(status_code=404, detail="Meso cycle not found")
    db.delete(meso)
    db.commit()
    return meso

@router.put("/mesos/{id}", response_model=schemas.MesoCycle)
def update_meso(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    meso_in: schemas.MesoCycleUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    meso = db.query(models.MesoCycle).filter(models.MesoCycle.id == id).first()
    if not meso:
        raise HTTPException(status_code=404, detail="Meso cycle not found")
    
    # Validation logic for updates
    update_data = meso_in.dict(exclude_unset=True)
    
    # Get the updated dates or use existing ones
    new_start = update_data.get('start_date', meso.start_date)
    new_end = update_data.get('end_date', meso.end_date)
    
    # Check parent boundaries
    macro = db.query(models.MacroCycle).filter(models.MacroCycle.id == meso.macro_id).first()
    if macro and (new_start < macro.start_date or new_end > macro.end_date):
        raise HTTPException(status_code=400, detail="Meso dates must be within Macro dates")
    
    # Check for overlaps with other mesos (excluding itself)
    existing_mesos = db.query(models.MesoCycle).filter(
        models.MesoCycle.macro_id == meso.macro_id,
        models.MesoCycle.id != id
    ).all()
    
    for existing in existing_mesos:
        if not (new_end < existing.start_date or new_start > existing.end_date):
            raise HTTPException(
                status_code=400, 
                detail=f"Meso dates overlap with existing mesocycle '{existing.name}'"
            )
    
    for field, value in update_data.items():
        setattr(meso, field, value)
    
    db.add(meso)
    db.commit()
    db.refresh(meso)
    return meso


# --- Micro Cycle Endpoints ---

@router.post("/micros/", response_model=schemas.MicroCycle)
def create_micro(
    *,
    db: Session = Depends(deps.get_db),
    micro_in: schemas.MicroCycleCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new micro cycle.
    """
    meso = db.query(models.MesoCycle).filter(models.MesoCycle.id == micro_in.meso_id).first()
    if not meso:
        raise HTTPException(status_code=404, detail="Parent meso cycle not found")
    
    if micro_in.start_date < meso.start_date or micro_in.end_date > meso.end_date:
        raise HTTPException(status_code=400, detail="Micro dates must be within Meso dates")
    
    # Check for overlaps with other micros in the same meso
    existing_micros = db.query(models.MicroCycle).filter(
        models.MicroCycle.meso_id == micro_in.meso_id
    ).all()
    
    for existing in existing_micros:
        # Check if date ranges overlap
        if not (micro_in.end_date < existing.start_date or micro_in.start_date > existing.end_date):
            raise HTTPException(
                status_code=400, 
                detail=f"Micro dates overlap with existing microcycle '{existing.name}'"
            )

    db_obj = models.MicroCycle(**micro_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/micros/{id}", response_model=schemas.MicroCycle)
def delete_micro(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    micro = db.query(models.MicroCycle).filter(models.MicroCycle.id == id).first()
    if not micro:
        raise HTTPException(status_code=404, detail="Micro cycle not found")
    db.delete(micro)
    db.commit()
    return micro

@router.put("/micros/{id}", response_model=schemas.MicroCycle)
def update_micro(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    micro_in: schemas.MicroCycleUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    micro = db.query(models.MicroCycle).filter(models.MicroCycle.id == id).first()
    if not micro:
        raise HTTPException(status_code=404, detail="Micro cycle not found")
    
    update_data = micro_in.dict(exclude_unset=True)
    
    # Get the updated dates or use existing ones
    new_start = update_data.get('start_date', micro.start_date)
    new_end = update_data.get('end_date', micro.end_date)
    
    # Check parent boundaries
    meso = db.query(models.MesoCycle).filter(models.MesoCycle.id == micro.meso_id).first()
    if meso and (new_start < meso.start_date or new_end > meso.end_date):
        raise HTTPException(status_code=400, detail="Micro dates must be within Meso dates")
    
    # Check for overlaps with other micros (excluding itself)
    existing_micros = db.query(models.MicroCycle).filter(
        models.MicroCycle.meso_id == micro.meso_id,
        models.MicroCycle.id != id
    ).all()
    
    for existing in existing_micros:
        if not (new_end < existing.start_date or new_start > existing.end_date):
            raise HTTPException(
                status_code=400, 
                detail=f"Micro dates overlap with existing microcycle '{existing.name}'"
            )
    
    for field, value in update_data.items():
        setattr(micro, field, value)
    
    db.add(micro)
    db.commit()
    db.refresh(micro)
    return micro

@router.get("/micros/{id}/summary")
def get_micro_summary(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Aggregated dashboard data for a specific micro cycle.
    """
    micro = db.query(models.MicroCycle).filter(models.MicroCycle.id == id).first()
    if not micro:
        raise HTTPException(status_code=404, detail="Micro cycle not found")
    
    # Placeholder for future aggregation of Assignments, Workouts, etc.
    return {
        "micro": micro,
        "summary": {
            "planned_volume": micro.volume,
            "executed_volume": 0, # To be implemented with Training Module
            "attendance_rate": 0,
            "wellness_avg": 0,
            "workouts_count": 0
        }
    }
