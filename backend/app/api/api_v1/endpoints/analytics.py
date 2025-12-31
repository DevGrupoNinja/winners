from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from app import models, schemas
from app.api import deps

router = APIRouter()

# --- Assessments ---

@router.get("/assessments/", response_model=List[schemas.Assessment])
def read_assessments(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
    athlete_id: Optional[int] = None,
) -> Any:
    query = db.query(models.Assessment)
    if athlete_id:
        query = query.filter(models.Assessment.athlete_id == athlete_id)
    return query.offset(skip).limit(limit).all()

@router.post("/assessments/", response_model=schemas.Assessment)
def create_assessment(
    *,
    db: Session = Depends(deps.get_db),
    assessment_in: schemas.AssessmentCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = models.Assessment(**assessment_in.dict())
    
    # Auto-update athlete current weight if provided
    if assessment_in.weight:
        athlete = db.query(models.Athlete).filter(models.Athlete.id == assessment_in.athlete_id).first()
        if athlete:
            athlete.body_weight = assessment_in.weight
            db.add(athlete)
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/assessments/{id}")
def delete_assessment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    obj = db.query(models.Assessment).filter(models.Assessment.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Assessment not found")
    db.delete(obj)
    db.commit()
    return {"status": "success"}

# --- Wellness ---

@router.get("/wellness/", response_model=List[schemas.Wellness])
def read_wellness(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
    athlete_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Any:
    query = db.query(models.Wellness)
    if athlete_id:
        query = query.filter(models.Wellness.athlete_id == athlete_id)
    if start_date:
        query = query.filter(models.Wellness.date >= start_date)
    if end_date:
        query = query.filter(models.Wellness.date <= end_date)
        
    return query.offset(skip).limit(limit).all()

@router.post("/wellness/", response_model=schemas.Wellness)
def create_wellness(
    *,
    db: Session = Depends(deps.get_db),
    wellness_in: schemas.WellnessCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    # Calculate overall score if not provided?
    # Simple average logic example
    scores = [
        wellness_in.sleep_quality,
        wellness_in.fatigue_level,
        wellness_in.muscle_soreness,
        wellness_in.stress_level
    ]
    valid_scores = [s for s in scores if s is not None]
    overall = sum(valid_scores) / len(valid_scores) if valid_scores else 0
    
    data = wellness_in.dict()
    data["overall_score"] = overall
    
    db_obj = models.Wellness(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
