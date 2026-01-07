import sqlite3

def delete_completed_sessions():
    conn = sqlite3.connect('winners.db')
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    print("=" * 60)
    print("DELETING COMPLETED SESSIONS")
    print("=" * 60)
    
    # Find completed sessions
    cursor.execute("SELECT id, date, status FROM trainingsession WHERE status = 'Completed'")
    sessions = cursor.fetchall()
    
    if not sessions:
        print("No completed sessions found.")
        conn.close()
        return

    print(f"Found {len(sessions)} completed sessions:")
    for s in sessions:
        print(f"ID: {s[0]} | Date: {s[1]} | Status: {s[2]}")
        
    session_ids = [s[0] for s in sessions]
    ids_placeholder = ','.join('?' for _ in session_ids)
    
    try:
        # 1. Delete SessionFeedback
        print(f"Deleting feedbacks for {len(session_ids)} sessions...")
        cursor.execute(f"DELETE FROM sessionfeedback WHERE session_id IN ({ids_placeholder})", session_ids)
        
        # 2. Get Series IDs to delete subdivisions
        cursor.execute(f"SELECT id FROM trainingseries WHERE session_id IN ({ids_placeholder})", session_ids)
        series_ids = [r[0] for r in cursor.fetchall()]
        
        if series_ids:
            series_placeholder = ','.join('?' for _ in series_ids)
            # 3. Delete Subdivisions
            print(f"Deleting subdivisions for {len(series_ids)} series...")
            cursor.execute(f"DELETE FROM trainingsubdivision WHERE series_id IN ({series_placeholder})", series_ids)
            
            # 4. Delete Series
            print(f"Deleting {len(series_ids)} series...")
            cursor.execute(f"DELETE FROM trainingseries WHERE session_id IN ({ids_placeholder})", session_ids)
        
        # 5. Delete Sessions
        print(f"Deleting {len(session_ids)} sessions...")
        cursor.execute(f"DELETE FROM trainingsession WHERE id IN ({ids_placeholder})", session_ids)
        
        conn.commit()
        print("Successfully deleted all completed sessions and related data.")
        
    except Exception as e:
        print(f"Error deleting sessions: {e}")
        conn.rollback()
    
    conn.close()

if __name__ == "__main__":
    delete_completed_sessions()
