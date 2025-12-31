from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Athlete])
def read_athletes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
    search: str = None,
    category: str = None,
    status: str = None,
) -> Any:
    """
    Retrieve athletes.
    """
    query = db.query(models.Athlete)
    
    if search:
        query = query.filter(models.Athlete.first_name.contains(search) | models.Athlete.last_name.contains(search))
    if category:
        query = query.filter(models.Athlete.category == category)
    if status:
        query = query.filter(models.Athlete.status == status)

    athletes = query.offset(skip).limit(limit).all()
    # Add computed name property for response
    for athlete in athletes:
        athlete.name = athlete.name 
    return athletes

@router.post("/", response_model=schemas.Athlete)
def create_athlete(
    *,
    db: Session = Depends(deps.get_db),
    athlete_in: schemas.AthleteCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new athlete.
    """
    athlete = db.query(models.Athlete).filter(models.Athlete.email == athlete_in.email).first()
    if athlete:
        raise HTTPException(status_code=400, detail="Athlete with this email already exists.")
    
    athlete = db.query(models.Athlete).filter(models.Athlete.cpf == athlete_in.cpf).first()
    if athlete:
        raise HTTPException(status_code=400, detail="Athlete with this CPF already exists.")

    db_obj = models.Athlete(**athlete_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    db_obj.name = db_obj.name # Computed
    return db_obj

@router.get("/{id}", response_model=schemas.Athlete)
def read_athlete(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get athlete by ID.
    """
    athlete = db.query(models.Athlete).filter(models.Athlete.id == id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    athlete.name = athlete.name
    return athlete

@router.put("/{id}", response_model=schemas.Athlete)
def update_athlete(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    athlete_in: schemas.AthleteUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update an athlete.
    """
    athlete = db.query(models.Athlete).filter(models.Athlete.id == id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    update_data = athlete_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(athlete, field, value)
    
    db.add(athlete)
    db.commit()
    db.refresh(athlete)
    athlete.name = athlete.name
    return athlete

@router.delete("/{id}", response_model=schemas.Athlete)
def delete_athlete(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete an athlete.
    """
    athlete = db.query(models.Athlete).filter(models.Athlete.id == id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    db.delete(athlete)
    db.commit()
    athlete.name = athlete.name
    return athlete
