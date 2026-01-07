import sqlite3

def check_feedbacks():
    conn = sqlite3.connect('winners.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("ALL SESSION FEEDBACKS")
    print("=" * 60)
    
    # Try to find name column
    cursor.execute('PRAGMA table_info(athlete)')
    athlete_cols = [c[1] for c in cursor.fetchall()]
    name_expr = "a.id"
    if 'name' in athlete_cols:
        name_expr = "a.name"
    elif 'first_name' in athlete_cols:
        name_expr = "a.first_name || ' ' || a.last_name"
    
    query = f"""
        SELECT 
            sf.id, 
            sf.session_id, 
            ts.date,
            sf.series_id, 
            sf.athlete_id, 
            {name_expr},
            sf.rpe_real, 
            sf.exhaustion_level
        FROM sessionfeedback sf
        LEFT JOIN athlete a ON sf.athlete_id = a.id
        LEFT JOIN trainingsession ts ON sf.session_id = ts.id
        ORDER BY sf.session_id DESC, sf.athlete_id, sf.series_id
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    
    for r in rows:
        print(f"Session {r[1]} ({r[2]}) | Series: {r[3]} | Athlete: {r[5]} (ID {r[4]}) | RPE: {r[6]} | EXH: {r[7]}")
        
    conn.close()

if __name__ == "__main__":
    check_feedbacks()
