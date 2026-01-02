"""
Script para limpar o histórico de treinos (sessões com status 'Completed' ou 'Active').
Mantém apenas os planos (status 'Planned').
"""
import sys
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models import TrainingSession

def clear_history():
    db = SessionLocal()
    try:
        # Buscar sessões que não são planos (Completed ou Active)
        history_sessions = db.query(TrainingSession).filter(
            TrainingSession.status.in_(['Completed', 'Active'])
        ).all()
        
        count = len(history_sessions)
        print(f"Encontradas {count} sessões no histórico para deletar.")
        
        if count == 0:
            print("Nada para limpar.")
            return
        
        confirm = input(f"Tem certeza que deseja deletar {count} sessões? (s/n): ")
        if confirm.lower() != 's':
            print("Operação cancelada.")
            return
        
        for session in history_sessions:
            print(f"  Deletando sessão {session.id} ({session.description}) - Status: {session.status}")
            db.delete(session)
        
        db.commit()
        print(f"\n✅ Deletadas {count} sessões do histórico.")
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_history()
