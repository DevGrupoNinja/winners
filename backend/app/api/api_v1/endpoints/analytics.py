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

@router.post("/assessments/bulk", response_model=List[schemas.Assessment])
def create_assessments_bulk(
    *,
    db: Session = Depends(deps.get_db),
    bulk_in: schemas.AssessmentBulkCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_objs = []
    for assessment_in in bulk_in.assessments:
        db_obj = models.Assessment(**assessment_in.dict())
        
        # Auto-update athlete current weight if provided
        if assessment_in.weight:
            athlete = db.query(models.Athlete).filter(models.Athlete.id == assessment_in.athlete_id).first()
            if athlete:
                athlete.body_weight = assessment_in.weight
                db.add(athlete)
        
        db.add(db_obj)
        db_objs.append(db_obj)
    
    db.commit()
    for obj in db_objs:
        db.refresh(obj)
    return db_objs

@router.put("/assessments/{id}", response_model=schemas.Assessment)
def update_assessment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    assessment_in: schemas.AssessmentUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = db.query(models.Assessment).filter(models.Assessment.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    update_data = assessment_in.dict(exclude_unset=True)
    if "weight" in update_data and update_data["weight"]:
        athlete = db.query(models.Athlete).filter(models.Athlete.id == db_obj.athlete_id).first()
        if athlete:
            athlete.body_weight = update_data["weight"]
            db.add(athlete)

    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
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

@router.post("/wellness/bulk", response_model=List[schemas.Wellness])
def create_wellness_bulk(
    *,
    db: Session = Depends(deps.get_db),
    bulk_in: schemas.WellnessBulkCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_objs = []
    for wellness_in in bulk_in.wellness_records:
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
        db_objs.append(db_obj)
    
    db.commit()
    for obj in db_objs:
        db.refresh(obj)
    return db_objs

@router.put("/wellness/{id}", response_model=schemas.Wellness)
def update_wellness(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    wellness_in: schemas.WellnessUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = db.query(models.Wellness).filter(models.Wellness.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Wellness record not found")
    
    update_data = wellness_in.dict(exclude_unset=True)
    
    # Re-calculate overall score if any component changed
    if any(k in update_data for k in ["sleep_quality", "fatigue_level", "muscle_soreness", "stress_level"]):
        new_scores = [
            update_data.get("sleep_quality", db_obj.sleep_quality),
            update_data.get("fatigue_level", db_obj.fatigue_level),
            update_data.get("muscle_soreness", db_obj.muscle_soreness),
            update_data.get("stress_level", db_obj.stress_level)
        ]
        valid_scores = [s for s in new_scores if s is not None]
        update_data["overall_score"] = sum(valid_scores) / len(valid_scores) if valid_scores else 0

    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
