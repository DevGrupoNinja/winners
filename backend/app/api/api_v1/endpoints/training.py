from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.TrainingSession])
def read_training_sessions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    return db.query(models.TrainingSession).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.TrainingSession)
def create_training_session(
    *,
    db: Session = Depends(deps.get_db),
    session_in: schemas.TrainingSessionCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    # Manual Nested Creation to ensure relationships and IDs are correct
    # Pydantic/SQLAlchemy interaction can be tricky with deep nesting, 
    # but straightforward iteration works well.
    
    session_data = session_in.dict(exclude={"series"})
    db_session = models.TrainingSession(**session_data)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    for series_data in session_in.series:
        subdivisions = series_data.subdivisions
        series_obj = models.TrainingSeries(
            **series_data.dict(exclude={"subdivisions"}), 
            session_id=db_session.id
        )
        db.add(series_obj)
        db.commit()
        db.refresh(series_obj)

        for sub_data in subdivisions:
            sub_obj = models.TrainingSubdivision(
                **sub_data.dict(), 
                series_id=series_obj.id
            )
            db.add(sub_obj)
        
        db.commit()

    db.refresh(db_session)
    return db_session

@router.get("/{id}", response_model=schemas.TrainingSession)
def read_training_session(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    return session

@router.post("/{id}/feedback", response_model=schemas.SessionFeedback)
def create_session_feedback(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    feedback_in: schemas.SessionFeedbackCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    # Ideally check if athlete exists too
    
    db_obj = models.SessionFeedback(**feedback_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
