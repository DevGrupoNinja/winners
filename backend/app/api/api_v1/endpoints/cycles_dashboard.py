from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date

from app import models, schemas
from app.api import deps

router = APIRouter()


def get_swimming_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None) -> dict:
    """Aggregate swimming training data for a date range.
    
    For a specific athlete: shows volumes from series where they have feedback.
    For all athletes (no filter): shows weighted average per feedback.
    """
    
    if athlete_id:
        # Atleta específico: soma das subdivisões das séries onde tem feedback
        feedbacks = db.query(models.SessionFeedback).join(
            models.TrainingSession
        ).filter(
            models.TrainingSession.date >= start_date,
            models.TrainingSession.date <= end_date,
            models.SessionFeedback.athlete_id == athlete_id,
            models.SessionFeedback.attendance == "Present"
        ).all()
        
        # Contar sessões únicas
        session_ids = set(f.session_id for f in feedbacks)
        total_sessions = len(session_ids)
        
        # Coletar series_ids com feedback (exclui None para feedbacks sem série específica)
        series_ids_with_feedback = set(f.series_id for f in feedbacks if f.series_id is not None)
        
        # Se não houver series_id específico, assumir que participou de todas as séries da sessão
        # (compatibilidade com dados antigos sem series_id)
        total_volume = 0.0
        ddr_volume = 0.0
        dcr_volume = 0.0
        
        if series_ids_with_feedback:
            # Buscar subdivisões apenas das séries com feedback
            series_list = db.query(models.TrainingSeries).filter(
                models.TrainingSeries.id.in_(series_ids_with_feedback)
            ).all()
            
            for series in series_list:
                for subdiv in series.subdivisions:
                    volume = (subdiv.distance or 0) * (subdiv.reps or 0)
                    total_volume += volume
                    if subdiv.type == "DDR":
                        ddr_volume += volume
                    elif subdiv.type == "DCR":
                        dcr_volume += volume
        else:
            # Fallback: sem series_id, usar todas as séries das sessões (dados antigos)
            for session_id in session_ids:
                session = db.query(models.TrainingSession).filter(
                    models.TrainingSession.id == session_id
                ).first()
                if session:
                    for series in session.series:
                        for subdiv in series.subdivisions:
                            volume = (subdiv.distance or 0) * (subdiv.reps or 0)
                            total_volume += volume
                            if subdiv.type == "DDR":
                                ddr_volume += volume
                            elif subdiv.type == "DCR":
                                dcr_volume += volume
    else:
        # Todos os atletas: média por atleta único
        # Cada atleta contribui com o volume das séries onde tem feedback
        
        feedbacks = db.query(models.SessionFeedback).join(
            models.TrainingSession
        ).filter(
            models.TrainingSession.date >= start_date,
            models.TrainingSession.date <= end_date,
            models.SessionFeedback.attendance == "Present"
        ).all()
        
        session_ids = set(f.session_id for f in feedbacks)
        total_sessions = len(session_ids)
        unique_athletes = set(f.athlete_id for f in feedbacks)
        total_unique_athletes = len(unique_athletes)
        
        # Calcular volume total por atleta
        # Para cada atleta, somar o volume das séries onde tem feedback
        athlete_volumes = {}  # athlete_id -> {total, ddr, dcr}
        
        for f in feedbacks:
            if f.athlete_id not in athlete_volumes:
                athlete_volumes[f.athlete_id] = {"total": 0.0, "ddr": 0.0, "dcr": 0.0}
            
            if f.series_id:
                series = db.query(models.TrainingSeries).filter(
                    models.TrainingSeries.id == f.series_id
                ).first()
                if series:
                    for subdiv in series.subdivisions:
                        volume = (subdiv.distance or 0) * (subdiv.reps or 0)
                        athlete_volumes[f.athlete_id]["total"] += volume
                        if subdiv.type == "DDR":
                            athlete_volumes[f.athlete_id]["ddr"] += volume
                        elif subdiv.type == "DCR":
                            athlete_volumes[f.athlete_id]["dcr"] += volume
        
        # Se nenhum feedback tem series_id, fallback para volume por sessão
        if not any(f.series_id for f in feedbacks):
            for f in feedbacks:
                if f.athlete_id not in athlete_volumes:
                    athlete_volumes[f.athlete_id] = {"total": 0.0, "ddr": 0.0, "dcr": 0.0}
                
                session = db.query(models.TrainingSession).filter(
                    models.TrainingSession.id == f.session_id
                ).first()
                if session:
                    for series in session.series:
                        for subdiv in series.subdivisions:
                            volume = (subdiv.distance or 0) * (subdiv.reps or 0)
                            athlete_volumes[f.athlete_id]["total"] += volume
                            if subdiv.type == "DDR":
                                athlete_volumes[f.athlete_id]["ddr"] += volume
                            elif subdiv.type == "DCR":
                                athlete_volumes[f.athlete_id]["dcr"] += volume
        
        # Calcular médias
        if total_unique_athletes > 0:
            total_volume = sum(v["total"] for v in athlete_volumes.values()) / total_unique_athletes
            ddr_volume = sum(v["ddr"] for v in athlete_volumes.values()) / total_unique_athletes
            dcr_volume = sum(v["dcr"] for v in athlete_volumes.values()) / total_unique_athletes
        else:
            total_volume = 0
            ddr_volume = 0
            dcr_volume = 0
    
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


def get_target_er_re(db: Session, start_date: date, end_date: date) -> dict:
    """Calculate average ER and RE from subdivisions of completed sessions with feedback.
    
    Only considers sessions that are completed and have at least one athlete feedback.
    """
    sessions = db.query(models.TrainingSession).filter(
        models.TrainingSession.date >= start_date,
        models.TrainingSession.date <= end_date,
        models.TrainingSession.status == "Completed"
    ).all()
    
    er_values = []
    re_values = []
    
    for session in sessions:
        # Check if session has any feedback (athlete participated)
        has_feedback = db.query(models.SessionFeedback).filter(
            models.SessionFeedback.session_id == session.id,
            models.SessionFeedback.attendance == "Present"
        ).first()
        
        if not has_feedback:
            continue
        
        # Get all subdivisions from this session's series
        for series in session.series:
            for subdiv in series.subdivisions:
                if subdiv.da_er is not None:
                    er_values.append(subdiv.da_er)
                if subdiv.da_re is not None:
                    re_values.append(subdiv.da_re)
    
    avg_er = sum(er_values) / len(er_values) if er_values else None
    avg_re = sum(re_values) / len(re_values) if re_values else None
    
    return {
        "target_er": round(avg_er, 2) if avg_er is not None else None,
        "target_re": round(avg_re, 2) if avg_re is not None else None,
    }


def get_gym_data(db: Session, start_date: date, end_date: date, athlete_id: Optional[int] = None, detailed: bool = False) -> dict:
    """Aggregate gym training data for a date range.
    
    For a specific athlete: shows their individual totals.
    For all athletes (no filter): shows weighted average per athlete (total load / unique athletes with feedback).
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
    
    if athlete_id:
        # Atleta específico: soma da carga dele nas sessões onde participou
        sessions = db.query(models.GymSession).filter(
            models.GymSession.date >= start_date,
            models.GymSession.date <= end_date
        ).all()
        
        total_load = 0.0
        sessions_count = 0
        
        for session in sessions:
            athlete_in_session = False
            for feedback in session.feedbacks:
                if feedback.athlete_id != int(athlete_id):
                    continue
                
                athlete_in_session = True
                if feedback.performed_loads:
                    for exercise_name, loads in feedback.performed_loads.items():
                        if isinstance(loads, list):
                            load_sum = sum(loads)
                            total_load += load_sum
                            if detailed:
                                capacity = get_exercise_capacity(session, exercise_name)
                                add_to_breakdown(capacity, load_sum)
            
            if athlete_in_session:
                sessions_count += 1
        
        total_sessions = sessions_count
        avg_load = total_load / total_sessions if total_sessions > 0 else 0
    else:
        # Todos os atletas: média por atleta = soma de todas cargas / número de atletas únicos com feedback
        sessions = db.query(models.GymSession).filter(
            models.GymSession.date >= start_date,
            models.GymSession.date <= end_date
        ).all()
        
        total_load = 0.0
        athletes_with_feedback = set()
        sessions_with_feedback = 0
        
        for session in sessions:
            has_feedback = False
            for feedback in session.feedbacks:
                if feedback.performed_loads:
                    has_feedback = True
                    athletes_with_feedback.add(feedback.athlete_id)
                    for exercise_name, loads in feedback.performed_loads.items():
                        if isinstance(loads, list):
                            load_sum = sum(loads)
                            total_load += load_sum
                            if detailed:
                                capacity = get_exercise_capacity(session, exercise_name)
                                add_to_breakdown(capacity, load_sum)
            
            if has_feedback:
                sessions_with_feedback += 1
        
        # Média por atleta
        num_athletes = len(athletes_with_feedback)
        total_sessions = sessions_with_feedback
        
        if num_athletes > 0:
            # Média = carga por atleta por sessão
            avg_load = (total_load / num_athletes) / total_sessions if total_sessions > 0 else 0
            total_load = total_load / num_athletes  # Mostrar média no total também
            # Also average the breakdown
            ddr_explosive = ddr_explosive / num_athletes
            ddr_explosiva = ddr_explosiva / num_athletes
            ddr_fast = ddr_fast / num_athletes
            ddr_resistance = ddr_resistance / num_athletes
            dcr_max = dcr_max / num_athletes
            dcr_resistive = dcr_resistive / num_athletes
        else:
            avg_load = 0
            total_load = 0
    
    result = {
        "total_load": round(total_load, 2),
        "total_sessions": total_sessions,
        "average_load": round(avg_load, 2),  # avg_load is already total_load/sessions (or per-athlete for aggregate)
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
    
    Returns **counts** (integers) for each functional base configured in the system,
    based on the functional_base field in TrainingSubdivision.
    Only shows bases that are configured in ConfigFunctionalDirectionRange.
    
    If athlete_id is provided, only count subdivisions from series where the athlete has feedback.
    """
    
    # Get all configured functional directions from the system
    configured_directions = db.query(models.ConfigFunctionalDirectionRange).all()
    
    # Initialize direction counts with ONLY configured directions
    direction_counts: dict[str, int] = {}
    direction_name_map: dict[str, str] = {}  # Maps normalized key to original name
    
    for config in configured_directions:
        original_name = config.direction
        normalized = original_name.lower().replace("á", "a").replace("é", "e").replace("ó", "o").replace(" ", "_")
        direction_counts[original_name] = 0
        direction_name_map[normalized] = original_name
    
    if athlete_id:
        # For specific athlete: only count subdivisions from series where they have feedback
        feedbacks = db.query(models.SessionFeedback).join(
            models.TrainingSession
        ).filter(
            models.TrainingSession.date >= start_date,
            models.TrainingSession.date <= end_date,
            models.SessionFeedback.athlete_id == athlete_id,
            models.SessionFeedback.attendance == "Present"
        ).all()
        
        series_ids_with_feedback = set(f.series_id for f in feedbacks if f.series_id is not None)
        
        if series_ids_with_feedback:
            subdivisions = db.query(models.TrainingSubdivision).filter(
                models.TrainingSubdivision.series_id.in_(series_ids_with_feedback),
                models.TrainingSubdivision.functional_base.isnot(None),
                models.TrainingSubdivision.functional_base != ""
            ).all()
        else:
            # Fallback: all subdivisions from sessions where athlete was present
            session_ids = set(f.session_id for f in feedbacks)
            subdivisions = db.query(models.TrainingSubdivision).join(
                models.TrainingSeries
            ).join(
                models.TrainingSession
            ).filter(
                models.TrainingSession.id.in_(session_ids),
                models.TrainingSubdivision.functional_base.isnot(None),
                models.TrainingSubdivision.functional_base != ""
            ).all()
    else:
        # All athletes: all subdivisions from completed sessions in date range
        subdivisions = db.query(models.TrainingSubdivision).join(
            models.TrainingSeries
        ).join(
            models.TrainingSession
        ).filter(
            models.TrainingSession.date >= start_date,
            models.TrainingSession.date <= end_date,
            models.TrainingSession.status == "Completed",
            models.TrainingSubdivision.functional_base.isnot(None),
            models.TrainingSubdivision.functional_base != ""
        ).all()
    
    # Count occurrences for each functional base
    for subdiv in subdivisions:
        fb = (subdiv.functional_base or "").strip()
        if not fb:
            continue
        
        # Normalize the functional base name for matching
        fb_normalized = fb.lower().replace("á", "a").replace("é", "e").replace("ó", "o").replace(" ", "_")
        
        # Try to find a matching configured direction
        matched = False
        for normalized_key, original_name in direction_name_map.items():
            if fb_normalized == normalized_key:
                direction_counts[original_name] += 1
                matched = True
                break
        
        # If no exact match, try pattern matching against configured directions
        if not matched:
            fb_lower = fb.lower()
            for normalized_key, original_name in direction_name_map.items():
                # Check if the subdivision's functional_base contains the direction name
                if normalized_key in fb_normalized or fb_normalized in normalized_key:
                    direction_counts[original_name] += 1
                    break
    
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
    gym = get_gym_data(db, macro.start_date, macro.end_date, detailed=True)
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
    functional_direction = get_functional_direction_data(db, meso.start_date, meso.end_date, None)
    target_er_re = get_target_er_re(db, meso.start_date, meso.end_date)
    
    return {
        "swimming": swimming,
        "gym": gym,
        "athletes": athletes,
        "wellness": wellness,
        "functional_direction": functional_direction,
        "target_er": target_er_re["target_er"],
        "target_re": target_er_re["target_re"],
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
