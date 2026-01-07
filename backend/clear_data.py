"""
Script para limpar dados de treinos, modelos, sessões de natação e preparo físico.
"""
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.models.training import (
    TrainingSession, 
    TrainingSeries, 
    TrainingSubdivision, 
    SessionFeedback
)
from app.models.gym import (
    GymTemplate, 
    GymExercise, 
    GymSession, 
    GymFeedback
)
from app.models.cycles import (
    MacroCycle, 
    MesoCycle, 
    MicroCycle
)

def clear_all_data():
    db: Session = SessionLocal()
    
    try:
        print("=" * 50)
        print("LIMPEZA DE DADOS - WINNERS")
        print("=" * 50)
        
        # --- Natação (Training) ---
        print("\n📊 Limpando dados de NATAÇÃO...")
        
        # SessionFeedback
        feedback_count = db.query(SessionFeedback).count()
        db.query(SessionFeedback).delete()
        print(f"   ✓ SessionFeedback: {feedback_count} registros removidos")
        
        # TrainingSubdivision
        subdivision_count = db.query(TrainingSubdivision).count()
        db.query(TrainingSubdivision).delete()
        print(f"   ✓ TrainingSubdivision: {subdivision_count} registros removidos")
        
        # TrainingSeries
        series_count = db.query(TrainingSeries).count()
        db.query(TrainingSeries).delete()
        print(f"   ✓ TrainingSeries: {series_count} registros removidos")
        
        # TrainingSession
        session_count = db.query(TrainingSession).count()
        db.query(TrainingSession).delete()
        print(f"   ✓ TrainingSession: {session_count} registros removidos")
        
        # --- Preparo Físico (Gym) ---
        print("\n🏋️ Limpando dados de PREPARO FÍSICO...")
        
        # GymFeedback
        gym_feedback_count = db.query(GymFeedback).count()
        db.query(GymFeedback).delete()
        print(f"   ✓ GymFeedback: {gym_feedback_count} registros removidos")
        
        # GymSession
        gym_session_count = db.query(GymSession).count()
        db.query(GymSession).delete()
        print(f"   ✓ GymSession: {gym_session_count} registros removidos")
        
        # GymExercise
        gym_exercise_count = db.query(GymExercise).count()
        db.query(GymExercise).delete()
        print(f"   ✓ GymExercise: {gym_exercise_count} registros removidos")
        
        # GymTemplate
        gym_template_count = db.query(GymTemplate).count()
        db.query(GymTemplate).delete()
        print(f"   ✓ GymTemplate: {gym_template_count} registros removidos")
        
        # --- Ciclos (Periodização) ---
        print("\n📅 Limpando dados de CICLOS (Periodização)...")
        
        # MicroCycle
        micro_count = db.query(MicroCycle).count()
        db.query(MicroCycle).delete()
        print(f"   ✓ MicroCycle: {micro_count} registros removidos")
        
        # MesoCycle
        meso_count = db.query(MesoCycle).count()
        db.query(MesoCycle).delete()
        print(f"   ✓ MesoCycle: {meso_count} registros removidos")
        
        # MacroCycle
        macro_count = db.query(MacroCycle).count()
        db.query(MacroCycle).delete()
        print(f"   ✓ MacroCycle: {macro_count} registros removidos")
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 50)
        print("✅ LIMPEZA CONCLUÍDA COM SUCESSO!")
        print("=" * 50)
        
        total = (
            feedback_count + subdivision_count + series_count + session_count +
            gym_feedback_count + gym_session_count + gym_exercise_count + gym_template_count +
            micro_count + meso_count + macro_count
        )
        print(f"\n📊 TOTAL: {total} registros removidos")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERRO: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # Ask for confirmation
    print("\n⚠️  ATENÇÃO: Este script irá APAGAR permanentemente:")
    print("   - Todos os treinos de natação (sessões, séries, subdivisões, feedbacks)")
    print("   - Todos os dados de preparo físico (templates, exercícios, sessões, feedbacks)")
    print("   - Todos os ciclos de periodização (macro, meso, micro)")
    print()
    
    confirm = input("Digite 'SIM' para confirmar a limpeza: ")
    
    if confirm.strip().upper() == "SIM":
        clear_all_data()
    else:
        print("\n❌ Operação cancelada pelo usuário.")
