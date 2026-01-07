from typing import Any
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.schemas import home_dashboard as schemas

router = APIRouter()


def get_current_micro(db: Session, today: date):
    """Find the current microcycle (today falls within its date range)."""
    return db.query(models.MicroCycle).filter(
        models.MicroCycle.start_date <= today,
        models.MicroCycle.end_date >= today
    ).first()


def get_current_meso(db: Session, today: date):
    """Find the current mesocycle (today falls within its date range)."""
    return db.query(models.MesoCycle).filter(
        models.MesoCycle.start_date <= today,
        models.MesoCycle.end_date >= today
    ).first()


def get_week_volume(db: Session, today: date) -> float:
    """Calculate total swimming volume for the current week (Monday to Sunday)."""
    # Get start and end of current week
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)  # Sunday
    
    # Get all completed training sessions in this week
    sessions = db.query(models.TrainingSession).filter(
        models.TrainingSession.date >= week_start,
        models.TrainingSession.date <= week_end,
        models.TrainingSession.status == "Completed"
    ).all()
    
    total_volume = 0.0
    for session in sessions:
        for series in session.series:
            for subdiv in series.subdivisions:
                if subdiv.distance:
                    # distance * reps
                    reps = subdiv.reps or 1
                    total_volume += subdiv.distance * reps
    
    return total_volume


def get_meso_progress(meso, today: date) -> float:
    """Calculate percentage progress through the mesocycle."""
    if not meso:
        return 0.0
    
    total_days = (meso.end_date - meso.start_date).days
    if total_days <= 0:
        return 100.0
    
    elapsed_days = (today - meso.start_date).days
    progress = (elapsed_days / total_days) * 100
    return min(max(progress, 0), 100)  # Clamp between 0-100


def get_ddr_dcr_percentages(db: Session, meso) -> tuple[float, float]:
    """Calculate DDR and DCR percentages for the mesocycle swimming volume."""
    if not meso:
        return 0.0, 0.0
    
    # Get all completed sessions in the meso date range
    sessions = db.query(models.TrainingSession).filter(
        models.TrainingSession.date >= meso.start_date,
        models.TrainingSession.date <= meso.end_date,
        models.TrainingSession.status == "Completed"
    ).all()
    
    ddr_volume = 0.0
    dcr_volume = 0.0
    
    for session in sessions:
        for series in session.series:
            for subdiv in series.subdivisions:
                if subdiv.distance:
                    reps = subdiv.reps or 1
                    volume = subdiv.distance * reps
                    if subdiv.type == "DDR":
                        ddr_volume += volume
                    elif subdiv.type == "DCR":
                        dcr_volume += volume
    
    total = ddr_volume + dcr_volume
    if total <= 0:
        return 0.0, 0.0
    
    return round((ddr_volume / total) * 100, 1), round((dcr_volume / total) * 100, 1)


def get_todays_pool_sessions(db: Session, today: date) -> list:
    """Get today's swimming training sessions."""
    sessions = db.query(models.TrainingSession).filter(
        models.TrainingSession.date == today,
        models.TrainingSession.status.in_(["Planned", "Active"])
    ).all()
    
    return [
        schemas.SessionSummary(
            id=s.id,
            title=s.title or "Treino de Natação",
            time=s.time.strftime("%H:%M") if s.time else None,
            status=s.status,
            type="pool"
        )
        for s in sessions
    ]


def get_todays_gym_sessions(db: Session, today: date) -> list:
    """Get today's gym sessions."""
    sessions = db.query(models.GymSession).filter(
        models.GymSession.date == today,
        models.GymSession.status.in_(["Planned", "Active"])
    ).all()
    
    return [
        schemas.SessionSummary(
            id=s.id,
            title=s.title or "Treino de Academia",
            time=s.time.strftime("%H:%M") if s.time else None,
            status=s.status,
            type="gym"
        )
        for s in sessions
    ]


@router.get("/dashboard", response_model=schemas.HomeDashboardResponse)
def get_home_dashboard(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get aggregated dashboard data for the home page.
    """
    today = date.today()
    
    # Indicators
    active_athletes_count = db.query(models.Athlete).filter(
        models.Athlete.status == "Active"
    ).count()
    
    current_micro = get_current_micro(db, today)
    current_meso = get_current_meso(db, today)
    week_volume = get_week_volume(db, today)
    
    # Planning view
    meso_progress = get_meso_progress(current_meso, today)
    ddr_pct, dcr_pct = get_ddr_dcr_percentages(db, current_meso)
    
    # Agenda
    todays_pool = get_todays_pool_sessions(db, today)
    todays_gym = get_todays_gym_sessions(db, today)
    
    return {
        "active_athletes_count": active_athletes_count,
        "current_micro": schemas.MicroInfo(
            id=current_micro.id,
            name=current_micro.name,
            start_date=current_micro.start_date,
            end_date=current_micro.end_date
        ) if current_micro else None,
        "week_volume": week_volume,
        "current_meso": schemas.MesoInfo(
            id=current_meso.id,
            name=current_meso.name,
            start_date=current_meso.start_date,
            end_date=current_meso.end_date
        ) if current_meso else None,
        "meso_progress": round(meso_progress, 1),
        "ddr_percentage": ddr_pct,
        "dcr_percentage": dcr_pct,
        "todays_pool_sessions": todays_pool,
        "todays_gym_sessions": todays_gym,
    }
