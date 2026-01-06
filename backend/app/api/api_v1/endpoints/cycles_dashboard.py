from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date

from app import models, schemas
from app.api import deps

router = APIRouter()


def get_swimming_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None) -> dict:
    """Aggregate swimming training data for a date range."""
    
    # Base query for sessions in range
    query = db.query(models.TrainingSession).filter(
        models.TrainingSession.date >= start_date,
        models.TrainingSession.date <= end_date
    )
    
    sessions = query.all()
    total_sessions = len(sessions)
    total_volume = sum(s.total_volume or 0 for s in sessions)
    
    # Calculate DDR/DCR volumes from subdivisions
    ddr_volume = 0.0
    dcr_volume = 0.0
    
    for session in sessions:
        for series in session.series:
            for subdiv in series.subdivisions:
                volume = (subdiv.distance or 0) * (subdiv.reps or 0)
                if subdiv.type == "DDR":
                    ddr_volume += volume
                elif subdiv.type == "DCR":
                    dcr_volume += volume
    
    # Convert to km
    total_volume_km = total_volume / 1000
    ddr_volume_km = ddr_volume / 1000
    dcr_volume_km = dcr_volume / 1000
    
    avg_per_session = total_volume / total_sessions if total_sessions > 0 else 0
    
    return {
        "total_volume": round(total_volume_km, 2),
        "total_sessions": total_sessions,
        "average_per_session": round(avg_per_session, 2),
        "ddr_volume": round(ddr_volume_km, 2),
        "dcr_volume": round(dcr_volume_km, 2),
    }


def get_gym_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None, detailed: bool = False) -> dict:
    """Aggregate gym training data for a date range."""
    
    query = db.query(models.GymSession).filter(
        models.GymSession.date >= start_date,
        models.GymSession.date <= end_date
    )
    
    sessions = query.all()
    total_sessions = len(sessions)
    
    # Calculate total load from feedbacks
    total_load = 0.0
    
    # For detailed breakdown (meso level)
    ddr_explosive = ddr_resistance = ddr_fast = dcr_max = dcr_resistive = 0.0
    
    for session in sessions:
        for feedback in session.feedbacks:
            if athlete_id and feedback.athlete_id != athlete_id:
                continue
                
            # Sum all loads from performed_loads dict
            if feedback.performed_loads:
                for exercise_name, loads in feedback.performed_loads.items():
                    if isinstance(loads, list):
                        total_load += sum(loads)
    
    avg_load = total_load / total_sessions if total_sessions > 0 else 0
    
    result = {
        "total_load": round(total_load, 2),
        "total_sessions": total_sessions,
        "average_load": round(avg_load, 2),
    }
    
    if detailed:
        # TODO: Implement breakdown by exercise type (DDR/DCR categories)
        # For now, distribute proportionally (placeholder logic)
        result.update({
            "ddr_explosive": round(total_load * 0.27, 2),
            "ddr_resistance": round(total_load * 0.12, 2),
            "ddr_fast": round(total_load * 0.34, 2),
            "dcr_max": round(total_load * 0.19, 2),
            "dcr_resistive": round(total_load * 0.08, 2),
        })
    
    return result


def get_athletes_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None) -> dict:
    """Aggregate athlete metrics for a date range."""
    
    # Get all active athletes
    athletes_query = db.query(models.Athlete).filter(models.Athlete.status == "Active")
    if athlete_id:
        athletes_query = athletes_query.filter(models.Athlete.id == athlete_id)
    
    athletes = athletes_query.all()
    
    improved_count = 0
    declined_count = 0
    weight_gained_count = 0
    weight_lost_count = 0
    
    for athlete in athletes:
        # Get first and last assessment in the range
        first_assessment = db.query(models.Assessment).filter(
            models.Assessment.athlete_id == athlete.id,
            models.Assessment.date >= start_date,
            models.Assessment.date <= end_date
        ).order_by(models.Assessment.date.asc()).first()
        
        last_assessment = db.query(models.Assessment).filter(
            models.Assessment.athlete_id == athlete.id,
            models.Assessment.date >= start_date,
            models.Assessment.date <= end_date
        ).order_by(models.Assessment.date.desc()).first()
        
        if first_assessment and last_assessment and first_assessment.id != last_assessment.id:
            # Check weight change
            if first_assessment.weight and last_assessment.weight:
                weight_diff = last_assessment.weight - first_assessment.weight
                if weight_diff > 0:
                    weight_gained_count += 1
                elif weight_diff < 0:
                    weight_lost_count += 1
            
            # Check performance improvement (using jump or throw as proxy)
            first_perf = (first_assessment.jump_height or 0) + (first_assessment.throw_distance or 0)
            last_perf = (last_assessment.jump_height or 0) + (last_assessment.throw_distance or 0)
            
            if last_perf > first_perf:
                improved_count += 1
            elif last_perf < first_perf:
                declined_count += 1
    
    # Calculate attendance from session feedbacks
    total_feedbacks = db.query(models.SessionFeedback).join(
        models.TrainingSession
    ).filter(
        models.TrainingSession.date >= start_date,
        models.TrainingSession.date <= end_date
    )
    
    if athlete_id:
        total_feedbacks = total_feedbacks.filter(models.SessionFeedback.athlete_id == athlete_id)
    
    total_feedbacks = total_feedbacks.all()
    
    present_count = sum(1 for f in total_feedbacks if f.attendance == "Present")
    attendance_rate = (present_count / len(total_feedbacks) * 100) if total_feedbacks else 0
    
    return {
        "improved_count": improved_count,
        "declined_count": declined_count,
        "average_attendance": round(attendance_rate, 2),
        "weight_gained_count": weight_gained_count,
        "weight_lost_count": weight_lost_count,
    }


def get_wellness_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None) -> dict:
    """Aggregate wellness data for a date range."""
    
    query = db.query(models.Wellness).filter(
        models.Wellness.date >= start_date,
        models.Wellness.date <= end_date
    )
    
    if athlete_id:
        query = query.filter(models.Wellness.athlete_id == athlete_id)
    
    wellness_records = query.all()
    
    if not wellness_records:
        return {
            "avg_sleep": None,
            "avg_fatigue": None,
            "avg_stress": None,
            "avg_muscle_soreness": None,
        }
    
    # Calculate averages, filtering out None values
    sleep_values = [w.sleep_quality for w in wellness_records if w.sleep_quality is not None]
    fatigue_values = [w.fatigue_level for w in wellness_records if w.fatigue_level is not None]
    stress_values = [w.stress_level for w in wellness_records if w.stress_level is not None]
    soreness_values = [w.muscle_soreness for w in wellness_records if w.muscle_soreness is not None]
    
    return {
        "avg_sleep": round(sum(sleep_values) / len(sleep_values), 1) if sleep_values else None,
        "avg_fatigue": round(sum(fatigue_values) / len(fatigue_values), 1) if fatigue_values else None,
        "avg_stress": round(sum(stress_values) / len(stress_values), 1) if stress_values else None,
        "avg_muscle_soreness": round(sum(soreness_values) / len(soreness_values), 1) if soreness_values else None,
    }


def get_functional_direction_data(db: Session, start_date: date, end_date: date) -> dict:
    """Aggregate functional direction data from training subdivisions."""
    
    # Get all subdivisions in the date range
    subdivisions = db.query(models.TrainingSubdivision).join(
        models.TrainingSeries
    ).join(
        models.TrainingSession
    ).filter(
        models.TrainingSession.date >= start_date,
        models.TrainingSession.date <= end_date
    ).all()
    
    # Count occurrences of each functional base
    direction_counts = {
        "aero": 0,
        "aero_ana": 0,
        "vo2": 0,
        "aa": 0,
        "res_ana": 0,
        "tol_ana": 0,
        "pot_ana": 0,
        "for_rap": 0,
        "for_exp": 0,
        "perna": 0,
        "braco": 0,
        "recup": 0,
    }
    
    for subdiv in subdivisions:
        fb = (subdiv.functional_base or "").lower()
        
        if "aero" in fb and "ana" not in fb:
            direction_counts["aero"] += 1
        elif "aero" in fb and "ana" in fb:
            direction_counts["aero_ana"] += 1
        elif "vo2" in fb:
            direction_counts["vo2"] += 1
        elif "aa" in fb or "limiar" in fb:
            direction_counts["aa"] += 1
        elif "res" in fb and "ana" in fb:
            direction_counts["res_ana"] += 1
        elif "tol" in fb and "ana" in fb:
            direction_counts["tol_ana"] += 1
        elif "pot" in fb and "ana" in fb:
            direction_counts["pot_ana"] += 1
        elif "rápid" in fb or "rapida" in fb:
            direction_counts["for_rap"] += 1
        elif "explos" in fb:
            direction_counts["for_exp"] += 1
        elif "perna" in fb:
            direction_counts["perna"] += 1
        elif "braço" in fb or "braco" in fb:
            direction_counts["braco"] += 1
        elif "recup" in fb:
            direction_counts["recup"] += 1
    
    return direction_counts


@router.get("/macros/{id}/dashboard", response_model=schemas.MacroDashboardResponse)
def get_macro_dashboard(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get aggregated dashboard data for a macro cycle.
    """
    macro = db.query(models.MacroCycle).filter(models.MacroCycle.id == id).first()
    if not macro:
        raise HTTPException(status_code=404, detail="Macro cycle not found")
    
    swimming = get_swimming_data(db, macro.start_date, macro.end_date)
    gym = get_gym_data(db, macro.start_date, macro.end_date)
    athletes = get_athletes_data(db, macro.start_date, macro.end_date)
    wellness = get_wellness_data(db, macro.start_date, macro.end_date)
    
    return {
        "swimming": swimming,
        "gym": gym,
        "athletes": athletes,
        "wellness": wellness,
        "results": {},
    }


@router.get("/mesos/{id}/dashboard", response_model=schemas.MesoDashboardResponse)
def get_meso_dashboard(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get aggregated dashboard data for a meso cycle.
    """
    meso = db.query(models.MesoCycle).filter(models.MesoCycle.id == id).first()
    if not meso:
        raise HTTPException(status_code=404, detail="Meso cycle not found")
    
    swimming = get_swimming_data(db, meso.start_date, meso.end_date)
    gym = get_gym_data(db, meso.start_date, meso.end_date, detailed=True)
    athletes = get_athletes_data(db, meso.start_date, meso.end_date)
    wellness = get_wellness_data(db, meso.start_date, meso.end_date)
    functional_direction = get_functional_direction_data(db, meso.start_date, meso.end_date)
    
    return {
        "swimming": swimming,
        "gym": gym,
        "athletes": athletes,
        "wellness": wellness,
        "functional_direction": functional_direction,
    }


@router.get("/micros/{id}/dashboard", response_model=schemas.MicroDashboardResponse)
def get_micro_dashboard(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    athlete_id: Optional[int] = Query(None, description="Filter by specific athlete ID"),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get aggregated dashboard data for a micro cycle.
    Optionally filter by athlete_id for individual view.
    """
    micro = db.query(models.MicroCycle).filter(models.MicroCycle.id == id).first()
    if not micro:
        raise HTTPException(status_code=404, detail="Micro cycle not found")
    
    swimming = get_swimming_data(db, micro.start_date, micro.end_date, athlete_id)
    gym = get_gym_data(db, micro.start_date, micro.end_date, athlete_id)
    athletes = get_athletes_data(db, micro.start_date, micro.end_date, athlete_id)
    wellness = get_wellness_data(db, micro.start_date, micro.end_date, athlete_id)
    functional_direction = get_functional_direction_data(db, micro.start_date, micro.end_date)
    
    # Calculate relative load (load / body weight)
    relative_load = None
    if athlete_id and gym["total_load"] > 0:
        # Get most recent assessment for this athlete in the cycle
        assessment = db.query(models.Assessment).filter(
            models.Assessment.athlete_id == athlete_id,
            models.Assessment.date >= micro.start_date,
            models.Assessment.date <= micro.end_date,
            models.Assessment.weight.isnot(None)
        ).order_by(models.Assessment.date.desc()).first()
        
        if assessment and assessment.weight:
            relative_load = round(gym["total_load"] / assessment.weight, 2)
    
    return {
        "swimming": swimming,
        "gym": gym,
        "athletes": athletes,
        "wellness": wellness,
        "functional_direction": functional_direction,
        "relative_load": relative_load,
    }
