"""
Script para recalcular o total_volume de todas as sessões de treino
baseado nas subdivisões existentes.
"""
import sys
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models import TrainingSession, TrainingSeries, TrainingSubdivision

def recalculate_volumes():
    db = SessionLocal()
    try:
        sessions = db.query(TrainingSession).all()
        print(f"Encontradas {len(sessions)} sessões de treino.")
        
        updated = 0
        for session in sessions:
            total_volume = 0.0
            for series in session.series:
                for sub in series.subdivisions:
                    # distance * reps (quantidade de repetições)
                    total_volume += (sub.distance or 0) * (sub.reps or 1)
            
            if session.total_volume != total_volume:
                old_volume = session.total_volume
                session.total_volume = total_volume
                db.add(session)
                updated += 1
                print(f"  Sessão {session.id} ({session.description}): {old_volume}m -> {total_volume}m")
        
        db.commit()
        print(f"\n✅ Atualizado o volume de {updated} sessões.")
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recalculate_volumes()
