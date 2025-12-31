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
        ex_obj = models.GymExercise(**ex_data.dict(), template_id=db_template.id)
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
    db_session = models.GymSession(**session_in.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

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
    
    db_obj = models.GymFeedback(**feedback_in.dict(), session_id=id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
