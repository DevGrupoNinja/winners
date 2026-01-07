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
    return db_obj


# --- Category Configuration Endpoints ---
# IMPORTANT: These routes MUST come BEFORE /{id} routes to avoid conflict

@router.get("/categories/", response_model=List[schemas.ConfigAthleteCategory])
def read_athlete_categories(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Get all active athlete categories."""
    return db.query(models.ConfigAthleteCategory).filter(
        models.ConfigAthleteCategory.is_active == 1
    ).all()

@router.post("/categories/", response_model=schemas.ConfigAthleteCategory)
def create_athlete_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: schemas.ConfigAthleteCategoryCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a new athlete category."""
    existing = db.query(models.ConfigAthleteCategory).filter(
        models.ConfigAthleteCategory.name == category_in.name
    ).first()
    if existing:
        if existing.is_active == 0:
            # Reactivate
            existing.is_active = 1
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_obj = models.ConfigAthleteCategory(**category_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/categories/{id}", response_model=schemas.ConfigAthleteCategory)
def update_athlete_category(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    category_in: schemas.ConfigAthleteCategoryCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Update an athlete category."""
    db_obj = db.query(models.ConfigAthleteCategory).filter(
        models.ConfigAthleteCategory.id == id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_obj.name = category_in.name
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/categories/{id}", response_model=schemas.ConfigAthleteCategory)
def delete_athlete_category(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Soft-delete an athlete category."""
    db_obj = db.query(models.ConfigAthleteCategory).filter(
        models.ConfigAthleteCategory.id == id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_obj.is_active = 0
    db.commit()
    db.refresh(db_obj)
    return db_obj


# --- Athlete CRUD with path parameters (MUST come AFTER static routes) ---

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
    return athlete
