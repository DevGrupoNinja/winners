from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date

from app import models, schemas
from app.api import deps

router = APIRouter()


def get_swimming_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None) -> dict:
    """Aggregate swimming training data based on PLANNED volume.
    
    Team view (no athlete): Total planned volume from all sessions.
    Athlete view: Volume from sessions where the athlete has attendance (SessionFeedback).
    """
    
    if athlete_id:
        # Get distinct session IDs where the athlete has feedback (attended)
        attended_session_ids = db.query(models.SessionFeedback.session_id).filter(
            models.SessionFeedback.athlete_id == athlete_id
        ).distinct().subquery()
        
        # Get parent sessions that the athlete attended (via their executed clones)
        sessions = db.query(models.TrainingSession).filter(
            models.TrainingSession.date >= start_date,
            models.TrainingSession.date <= end_date,
            models.TrainingSession.parent_session_id.is_(None), # Only PLANNED sessions
            models.TrainingSession.id.in_(
                db.query(models.TrainingSession.parent_session_id).filter(
                    models.TrainingSession.id.in_(attended_session_ids)
                )
            ) | models.TrainingSession.id.in_(attended_session_ids)
        ).all()
    else:
        # Team view: all planned sessions
        sessions = db.query(models.TrainingSession).filter(
            models.TrainingSession.date >= start_date,
            models.TrainingSession.date <= end_date,
            models.TrainingSession.parent_session_id.is_(None)
        ).all()
    
    total_volume = 0.0
    ddr_volume = 0.0
    dcr_volume = 0.0
    
    session_ids = set()
    
    for session in sessions:
        session_ids.add(session.id)
        
        # Calculate volume from series -> subdivisions
        for series in session.series:
            for subdiv in series.subdivisions:
                volume = (subdiv.distance or 0) * (subdiv.reps or 0)
                total_volume += volume
                
                if subdiv.type == "DDR":
                    ddr_volume += volume
                elif subdiv.type == "DCR":
                    dcr_volume += volume
    
    total_sessions = len(session_ids)
    
    # Convert to km
    total_volume_km = total_volume / 1000
    ddr_volume_km = ddr_volume / 1000
    dcr_volume_km = dcr_volume / 1000
    
    # Average meters per session (based on plan)
    avg_per_session = total_volume / total_sessions if total_sessions > 0 else 0
    
    return {
        "total_volume": round(total_volume_km, 2),
        "total_sessions": total_sessions,
        "average_per_session": round(avg_per_session, 2),
        "ddr_volume": round(ddr_volume_km, 2),
        "dcr_volume": round(dcr_volume_km, 2),
    }



def get_target_er_re(db: Session, start_date: date, end_date: date) -> dict:
    """Calculate weighted average ER and RE from PLANNED subdivisions.
    
    Weighted by subdivision distance (volume).
    Considers all sessions in the date range.
    """
    sessions = db.query(models.TrainingSession).filter(
        models.TrainingSession.date >= start_date,
        models.TrainingSession.date <= end_date,
        models.TrainingSession.parent_session_id.is_(None) # Only count PLANNED sessions
    ).all()
    
    total_er_weighted = 0.0
    total_er_distance = 0.0
    
    total_re_weighted = 0.0
    total_re_distance = 0.0
    
    for session in sessions:
        for series in session.series:
            for subdiv in series.subdivisions:
                dist = subdiv.distance or 0
                if dist <= 0:
                    continue
                
                if subdiv.da_er is not None:
                    total_er_weighted += (subdiv.da_er * dist)
                    total_er_distance += dist
                
                if subdiv.da_re is not None:
                    total_re_weighted += (subdiv.da_re * dist)
                    total_re_distance += dist
    
    avg_er = total_er_weighted / total_er_distance if total_er_distance > 0 else None
    avg_re = total_re_weighted / total_re_distance if total_re_distance > 0 else None
    
    return {
        "target_er": round(avg_er, 2) if avg_er is not None else None,
        "target_re": round(avg_re, 2) if avg_re is not None else None,
    }


def get_gym_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None, detailed: bool = False) -> dict:
    """Aggregate gym training data for a date range.
    
    Total Load is the ABSOLUTE SUM of all loads lifted by the team (or athlete).
    It is NOT an average per athlete anymore.
    """
    
    # DDR/DCR category mapping
    DDR_TYPES = {"Força Explosiva", "Explosiva", "Força Rápida", "Resistência Força"}
    DCR_TYPES = {"Força Máxima", "Força Resistiva"}
    
    # Initialize breakdown accumulators
    ddr_explosive = 0.0  # Força Explosiva
    ddr_explosiva = 0.0  # Explosiva (separate)
    ddr_fast = 0.0
    ddr_resistance = 0.0
    dcr_max = 0.0
    dcr_resistive = 0.0
    
    def get_exercise_capacity(session, exercise_name):
        """Get physicalMotorCapacity for an exercise from session's exercises_snapshot."""
        exercises = session.exercises_snapshot or []
        for ex in exercises:
            if ex.get("name") == exercise_name:
                return ex.get("physicalMotorCapacity", "")
        return ""
    
    def add_to_breakdown(capacity, load_sum):
        nonlocal ddr_explosive, ddr_explosiva, ddr_fast, ddr_resistance, dcr_max, dcr_resistive
        if capacity == "Força Explosiva":
            ddr_explosive += load_sum
        elif capacity == "Explosiva":
            ddr_explosiva += load_sum
        elif capacity == "Força Rápida":
            ddr_fast += load_sum
        elif capacity == "Resistência Força":
            ddr_resistance += load_sum
        elif capacity == "Força Máxima":
            dcr_max += load_sum
        elif capacity == "Força Resistiva":
            dcr_resistive += load_sum
    
    # Common query for sessions in range
    sessions = db.query(models.GymSession).filter(
        models.GymSession.date >= start_date,
        models.GymSession.date <= end_date
    ).all()
    
    total_load = 0.0
    sessions_with_feedback_count = 0
    
    for session in sessions:
        session_has_relevant_feedback = False
        
        for feedback in session.feedbacks:
            # Filter by athlete if requested
            if athlete_id and feedback.athlete_id != int(athlete_id):
                continue
            
            if feedback.performed_loads:
                # Mark session as having feedback (for average calculation)
                session_has_relevant_feedback = True
                
                # Sum loads
                for exercise_name, loads in feedback.performed_loads.items():
                    if isinstance(loads, list):
                        load_sum = sum(loads)
                        total_load += load_sum
                        if detailed:
                            capacity = get_exercise_capacity(session, exercise_name)
                            add_to_breakdown(capacity, load_sum)
        
        if session_has_relevant_feedback:
            sessions_with_feedback_count += 1
    
    # Average load per realized session
    avg_load = total_load / sessions_with_feedback_count if sessions_with_feedback_count > 0 else 0
    
    result = {
        "total_load": round(total_load, 2),
        "total_sessions": sessions_with_feedback_count,
        "average_load": round(avg_load, 2),
    }
    
    if detailed:
        result.update({
            "ddr_explosive": round(ddr_explosive, 2),
            "ddr_explosiva": round(ddr_explosiva, 2),
            "ddr_resistance": round(ddr_resistance, 2),
            "ddr_fast": round(ddr_fast, 2),
            "dcr_max": round(dcr_max, 2),
            "dcr_resistive": round(dcr_resistive, 2),
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


def get_functional_direction_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None) -> dict:
    """
    Aggregate functional direction data from training subdivisions.
    
    Returns **volume** (float, in meters) for each functional base configured in the system,
    based on the functional_base field in TrainingSubdivision.
    Only shows bases that are configured in ConfigFunctionalDirectionRange.
    
    Considers all PLANNED subdivisions in the date range.
    """
    
    # Get all configured functional directions from the system
    configured_directions = db.query(models.ConfigFunctionalDirectionRange).all()
    
    # Initialize direction volumes with ONLY configured directions
    direction_volumes: dict[str, float] = {}
    direction_name_map: dict[str, str] = {}  # Maps normalized key to original name
    
    for config in configured_directions:
        original_name = config.direction
        normalized = original_name.lower().replace("á", "a").replace("é", "e").replace("ó", "o").replace(" ", "_")
        direction_volumes[original_name] = 0.0
        direction_name_map[normalized] = original_name
    
    # All athletes/team: all subdivisions from sessions in date range
    subdivisions = db.query(models.TrainingSubdivision).join(
        models.TrainingSeries
    ).join(
        models.TrainingSession
    ).filter(
        models.TrainingSession.date >= start_date,
        models.TrainingSession.date <= end_date,
        models.TrainingSession.parent_session_id.is_(None), # Only count PLANNED sessions
        models.TrainingSubdivision.functional_base.isnot(None),
        models.TrainingSubdivision.functional_base != ""
    ).all()
    
    # Sum volume for each functional base
    for subdiv in subdivisions:
        fb = (subdiv.functional_base or "").strip()
        if not fb:
            continue
            
        volume = (subdiv.distance or 0) * (subdiv.reps or 0)
        if volume <= 0:
            continue
        
        # Normalize the functional base name for matching
        fb_normalized = fb.lower().replace("á", "a").replace("é", "e").replace("ó", "o").replace(" ", "_")
        
        # Try to find a matching configured direction
        matched = False
        for normalized_key, original_name in direction_name_map.items():
            if fb_normalized == normalized_key:
                direction_volumes[original_name] += volume
                matched = True
                break
        
        # If no exact match, try pattern matching against configured directions
        if not matched:
            for normalized_key, original_name in direction_name_map.items():
                # Check if the subdivision's functional_base contains the direction name
                if normalized_key in fb_normalized or fb_normalized in normalized_key:
                    direction_volumes[original_name] += volume
                    break
    
    return direction_volumes


def calculate_relative_load(db: Session, start_date: date, end_date: date, total_load: float, athlete_id: Optional[int] = None) -> Optional[float]:
    """Calculate relative load (Total Load / Body Weight).
    
    If athlete_id is provided: Load / Athlete's Weight.
    If no athlete_id (Team): Total Team Load / Sum of weights of all Active athletes.
    """
    if total_load <= 0:
        return None

    total_weight = 0.0
    
    if athlete_id:
        # Specific athlete weight
        assessment = db.query(models.Assessment).filter(
            models.Assessment.athlete_id == athlete_id,
            models.Assessment.date <= end_date, # Use most recent relative to cycle end
            models.Assessment.weight.isnot(None)
        ).order_by(models.Assessment.date.desc()).first()
        
        if assessment and assessment.weight:
            total_weight = assessment.weight
    else:
        # Team weight (Sum of all active athletes' latest weight)
        # 1. Get all active athletes
        active_athletes = db.query(models.Athlete).filter(models.Athlete.status == "Active").all()
        
        for athlete in active_athletes:
            # Get latest weight for each athlete
            assessment = db.query(models.Assessment).filter(
                models.Assessment.athlete_id == athlete.id,
                models.Assessment.date <= end_date,
                models.Assessment.weight.isnot(None)
            ).order_by(models.Assessment.date.desc()).first()
            
            if assessment and assessment.weight:
                total_weight += assessment.weight

    if total_weight > 0:
        return round(total_load / total_weight, 2)
    
    return None


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
    gym = get_gym_data(db, macro.start_date, macro.end_date, detailed=True)
    athletes = get_athletes_data(db, macro.start_date, macro.end_date)
    wellness = get_wellness_data(db, macro.start_date, macro.end_date)
    
    relative_load = calculate_relative_load(db, macro.start_date, macro.end_date, gym["total_load"])
    
    return {
        "swimming": swimming,
        "gym": gym,
        "athletes": athletes,
        "wellness": wellness,
        "results": {},
        "relative_load": relative_load,
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
    functional_direction = get_functional_direction_data(db, meso.start_date, meso.end_date, None)
    target_er_re = get_target_er_re(db, meso.start_date, meso.end_date)
    
    relative_load = calculate_relative_load(db, meso.start_date, meso.end_date, gym["total_load"])
    
    return {
        "swimming": swimming,
        "gym": gym,
        "athletes": athletes,
        "wellness": wellness,
        "functional_direction": functional_direction,
        "target_er": target_er_re["target_er"],
        "target_re": target_er_re["target_re"],
        "relative_load": relative_load,
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
    gym = get_gym_data(db, micro.start_date, micro.end_date, athlete_id, detailed=True)
    athletes = get_athletes_data(db, micro.start_date, micro.end_date, athlete_id)
    wellness = get_wellness_data(db, micro.start_date, micro.end_date, athlete_id)
    functional_direction = get_functional_direction_data(db, micro.start_date, micro.end_date, athlete_id)
    
    relative_load = calculate_relative_load(db, micro.start_date, micro.end_date, gym["total_load"], athlete_id)
    
    return {
        "swimming": swimming,
        "gym": gym,
        "athletes": athletes,
        "wellness": wellness,
        "functional_direction": functional_direction,
        "relative_load": relative_load,
    }
