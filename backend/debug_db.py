import sys
from app.db.session import SessionLocal
from app.models.gym import GymSession
from sqlalchemy import text

def check_db():
    db = SessionLocal()
    try:
        # Check if table exists
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='gymsession'"))
        if not result.first():
            print("Table gymsession does not exist.")
            return

        # Check for columns
        print("Attempting to query GymSession...")
        sessions = db.query(GymSession).limit(1).all()
        print("Query successful.")
        
        # Check columns specifically (for SQLite)
        cols = db.execute(text("PRAGMA table_info(gymsession)")).fetchall()
        col_names = [c[1] for c in cols]
        print(f"Columns: {col_names}")
        
        if 'category' not in col_names:
            print("MISSING COLUMN: category")
        if 'exercises_snapshot' not in col_names:
            print("MISSING COLUMN: exercises_snapshot")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
