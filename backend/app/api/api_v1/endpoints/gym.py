from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

# --- Templates ---

@router.get("/templates/", response_model=List[schemas.GymTemplate])
def read_templates(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    return db.query(models.GymTemplate).offset(skip).limit(limit).all()

@router.post("/templates/", response_model=schemas.GymTemplate)
def create_template(
    *,
    db: Session = Depends(deps.get_db),
    template_in: schemas.GymTemplateCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    # Manual Nested Creation
    template_data = template_in.dict(exclude={"exercises"})
    db_template = models.GymTemplate(**template_data)
    db.add(db_template)
    db.commit()
    db.refresh(db_template)

    for ex_data in template_in.exercises:
        ex_dict = ex_data.dict()
        # Map frontend 'physicalMotorCapacity' to backend 'muscle_group' if present
        if 'physicalMotorCapacity' in ex_dict:
            if not ex_dict.get('muscle_group') and ex_dict['physicalMotorCapacity']:
                ex_dict['muscle_group'] = ex_dict['physicalMotorCapacity']
            del ex_dict['physicalMotorCapacity']
            
        ex_obj = models.GymExercise(**ex_dict, template_id=db_template.id)
        db.add(ex_obj)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/templates/{id}")
def delete_template(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    template = db.query(models.GymTemplate).filter(models.GymTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"status": "success"}

@router.put("/templates/{id}", response_model=schemas.GymTemplate)
def update_template(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    template_in: schemas.GymTemplateCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    template = db.query(models.GymTemplate).filter(models.GymTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Update template fields
    template.title = template_in.title
    template.category = template_in.category
    
    # Delete existing exercises and recreate
    db.query(models.GymExercise).filter(models.GymExercise.template_id == id).delete()
    
    for ex_data in template_in.exercises:
        ex_dict = ex_data.dict()
        # Map frontend 'physicalMotorCapacity' to backend 'muscle_group' if present
        if 'physicalMotorCapacity' in ex_dict:
            if not ex_dict.get('muscle_group') and ex_dict['physicalMotorCapacity']:
                ex_dict['muscle_group'] = ex_dict['physicalMotorCapacity']
            del ex_dict['physicalMotorCapacity']
            
        ex_obj = models.GymExercise(**ex_dict, template_id=id)
        db.add(ex_obj)
    
    db.commit()
    db.refresh(template)
    return template

def parse_time_string(time_str: str) -> Any:
    from datetime import time as dt_time
    if not time_str:
        return None
    try:
        parts = time_str.split(":")
        return dt_time(int(parts[0]), int(parts[1]))
    except (ValueError, IndexError):
        return None

# --- Sessions ---

@router.get("/sessions/", response_model=List[schemas.GymSession])
def read_sessions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    return db.query(models.GymSession).offset(skip).limit(limit).all()

@router.post("/sessions/", response_model=schemas.GymSession)
def create_session(
    *,
    db: Session = Depends(deps.get_db),
    session_in: schemas.GymSessionCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    session_data = session_in.dict()
    # Map exercises list to exercises_snapshot JSON
    if 'exercises' in session_data and session_data['exercises']:
        session_data['exercises_snapshot'] = session_data['exercises']
        del session_data['exercises']
        
    # Handle time
    if 'time' in session_data:
        session_data['time'] = parse_time_string(session_data['time'])

    db_session = models.GymSession(**session_data)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.post("/sessions/{id}/start", response_model=schemas.GymSession)
def start_session(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    session_start: schemas.GymSessionStart,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Start a gym session from a planned workout.
    Creates a CLONE of the plan (GymSession) with status 'Active'.
    The original plan remains 'Planned'.
    """
    original_session = db.query(models.GymSession).filter(models.GymSession.id == id).first()
    if not original_session:
        raise HTTPException(status_code=404, detail="Gym Workout plan not found")

    # Clone Session
    new_session = models.GymSession(
        date=original_session.date,
        time=parse_time_string(session_start.time), # Use parsed time
        title=original_session.title,
        category=original_session.category,
        template_snapshot_id=original_session.template_snapshot_id,
        status="Active",
        exercises_snapshot=original_session.exercises_snapshot,
        parent_session_id=original_session.id
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.delete("/sessions/{id}")
def delete_session(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    session = db.query(models.GymSession).filter(models.GymSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Gym Session not found")
    db.delete(session)
    db.commit()
    return {"status": "success"}

@router.put("/sessions/{id}", response_model=schemas.GymSession)
def update_session(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    session_in: schemas.GymSessionCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    session = db.query(models.GymSession).filter(models.GymSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Gym Session not found")
    
    session_data = session_in.dict(exclude_unset=True)
    
    # Handle time parsing
    if 'time' in session_data:
        session_data['time'] = parse_time_string(session_data['time'])

    # Handle exercises -> snapshot mapping
    if 'exercises' in session_data:
        session_data['exercises_snapshot'] = session_data['exercises']
        del session_data['exercises']
        
    for field, value in session_data.items():
        setattr(session, field, value)
        
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.post("/sessions/{id}/feedback", response_model=schemas.GymFeedback)
def create_gym_feedback(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    feedback_in: schemas.GymFeedbackCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    session = db.query(models.GymSession).filter(models.GymSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Gym Session not found")
    
    # Check if feedback already exists for this athlete in this session
    existing_feedback = db.query(models.GymFeedback).filter(
        models.GymFeedback.session_id == id,
        models.GymFeedback.athlete_id == feedback_in.athlete_id
    ).first()
    
    if existing_feedback:
        # Update existing
        for field, value in feedback_in.dict().items():
            setattr(existing_feedback, field, value)
        db_obj = existing_feedback
    else:
        # Create new
        db_obj = models.GymFeedback(**feedback_in.dict(), session_id=id)
        db.add(db_obj)
        
    db.commit()
    db.refresh(db_obj)
    return db_obj
