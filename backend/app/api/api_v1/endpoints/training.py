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

@router.get("/functional-direction-ranges", response_model=List[schemas.ConfigFunctionalDirectionRange])
def read_functional_direction_ranges(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    return db.query(models.ConfigFunctionalDirectionRange).all()

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

    total_volume = 0.0
    
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
            # Sum distance * reps for total volume
            total_volume += (sub_data.distance or 0) * (sub_data.reps or 1)
        
        db.commit()

    # Update session with calculated total_volume
    db_session.total_volume = total_volume
    db.add(db_session)
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

@router.post("/{id}/series", response_model=schemas.TrainingSeries)
def add_series_to_session(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    series_in: schemas.TrainingSeriesCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Add a new series to an existing training session."""
    session = db.query(models.TrainingSession).filter(models.TrainingSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    subdivisions_data = series_in.subdivisions
    series_obj = models.TrainingSeries(
        **series_in.dict(exclude={"subdivisions"}),
        session_id=session.id
    )
    db.add(series_obj)
    db.commit()
    db.refresh(series_obj)
    
    added_volume = 0.0
    for sub_data in subdivisions_data:
        sub_obj = models.TrainingSubdivision(
            **sub_data.dict(),
            series_id=series_obj.id
        )
        db.add(sub_obj)
        added_volume += (sub_data.distance or 0) * (sub_data.reps or 1)
    
    # Update session total_volume
    session.total_volume = (session.total_volume or 0) + added_volume
    db.add(session)
    db.commit()
    db.refresh(series_obj)
    return series_obj

@router.post("/{id}/start", response_model=schemas.TrainingSession)
def start_session(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Start a training session from a planned workout.
    Creates a CLONE of the plan (TrainingSession) with status 'Active'.
    The original plan remains 'Planned'.
    """
    original_session = db.query(models.TrainingSession).filter(models.TrainingSession.id == id).first()
    if not original_session:
        raise HTTPException(status_code=404, detail="Workout plan not found")

    # Clone Session
    new_session = models.TrainingSession(
        date=original_session.date, # Maybe today? For now keep plan date, can be updated on start
        time=None, # Will be set on frontend or here if we want immediate start time
        profile=original_session.profile,
        category=original_session.category,
        micro_cycle_id=original_session.micro_cycle_id,
        status="Active",
        description=original_session.description,
        total_volume=original_session.total_volume,
        parent_session_id=original_session.id
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Clone Series
    for series in original_session.series:
        new_series = models.TrainingSeries(
            session_id=new_session.id,
            order=series.order,
            name=series.name,
            reps=series.reps,
            rpe_target=series.rpe_target,
            rpe_description=series.rpe_description,
            instructions=series.instructions,
            total_distance=series.total_distance
        )
        db.add(new_series)
        db.commit()
        db.refresh(new_series)

        # Clone Subdivisions
        for sub in series.subdivisions:
            new_sub = models.TrainingSubdivision(
                series_id=new_series.id,
                order=sub.order,
                type=sub.type,
                reps=sub.reps,
                distance=sub.distance,
                style=sub.style,
                interval_time=sub.interval_time,
                pause_time=sub.pause_time,
                da_re=sub.da_re,
                da_er=sub.da_er,
                observation=sub.observation,
                functional_base=sub.functional_base,
            )
            db.add(new_sub)
    
    db.commit()
    db.refresh(new_session)
    return new_session

@router.put("/{id}", response_model=schemas.TrainingSession)
def update_training_session(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    session_in: schemas.TrainingSessionUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = db.query(models.TrainingSession).filter(models.TrainingSession.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    update_data = session_in.dict(exclude_unset=True)
    
    # Handle series update if present
    if "series" in update_data:
        # Clear existing series (with delete-orphan this deletes them and their subdivisions)
        db_obj.series = []
        db.commit()
        db.refresh(db_obj)
        
        # Create new series
        series_data_list = update_data.pop("series")
        total_volume = 0.0
        
        for series_data in series_data_list:
            if hasattr(series_data, 'dict'):
                s_data = series_data.dict()
            else:
                s_data = series_data
                
            subdivisions = s_data.pop("subdivisions", [])
            
            series_obj = models.TrainingSeries(
                **s_data,
                session_id=db_obj.id
            )
            db.add(series_obj)
            db.commit()
            db.refresh(series_obj)
            
            for sub_data in subdivisions:
                if hasattr(sub_data, 'dict'):
                    sub_dict = sub_data.dict()
                else:
                    sub_dict = sub_data
                    
                sub_obj = models.TrainingSubdivision(
                    **sub_dict,
                    series_id=series_obj.id
                )
                db.add(sub_obj)
                total_volume += (sub_dict.get("distance") or 0) * (sub_dict.get("reps") or 1)
            
        update_data["total_volume"] = total_volume

    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=schemas.TrainingSession)
def delete_training_session(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = db.query(models.TrainingSession).filter(models.TrainingSession.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    db.delete(db_obj)
    db.commit()
    return db_obj
