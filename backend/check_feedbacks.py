"""
Script para verificar os feedbacks de sessão no banco de dados.
"""
import sqlite3

def check_feedbacks():
    conn = sqlite3.connect('winners.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("FEEDBACKS DE SESSÃO")
    print("=" * 60)
    
    cursor.execute("""
        SELECT 
            sf.id, 
            sf.session_id, 
            sf.athlete_id, 
            sf.rpe_real, 
            sf.exhaustion_level, 
            sf.attendance, 
            a.name as athlete_name,
            ts.date as session_date,
            ts.status as session_status
        FROM sessionfeedback sf 
        LEFT JOIN athlete a ON sf.athlete_id = a.id 
        LEFT JOIN trainingsession ts ON sf.session_id = ts.id
        ORDER BY sf.session_id, sf.athlete_id
    """)
    rows = cursor.fetchall()
    
    for r in rows:
        print(f"Session {r[1]} ({r[7]}, {r[8]}): {r[6]} - RPE: {r[3]}, Exh: {r[4]}, Att: {r[5]}")
    
    print(f"\nTotal: {len(rows)} feedbacks")
    
    conn.close()

if __name__ == "__main__":
    check_feedbacks()
