import sys
from app.db.session import SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("Checking gymsession columns...")
        cols = db.execute(text("PRAGMA table_info(gymsession)")).fetchall()
        col_names = [c[1] for c in cols]
        print(f"Existing columns: {col_names}")

        if 'category' not in col_names:
            print("Adding category...")
            db.execute(text("ALTER TABLE gymsession ADD COLUMN category VARCHAR DEFAULT 'Geral'"))
        
        if 'exercises_snapshot' not in col_names:
            print("Adding exercises_snapshot...")
            db.execute(text("ALTER TABLE gymsession ADD COLUMN exercises_snapshot JSON"))
            
        if 'status' not in col_names:
            print("Adding status...")
            db.execute(text("ALTER TABLE gymsession ADD COLUMN status VARCHAR DEFAULT 'Planned'"))

        db.commit()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
