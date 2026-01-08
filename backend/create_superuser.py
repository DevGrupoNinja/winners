from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import os

def create_superuser():
    db = SessionLocal()
    try:
        email = os.getenv("FIRST_SUPERUSER", "admin@winners.com")
        password = os.getenv("FIRST_SUPERUSER_PASSWORD", "admin")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name="Admin",
                hashed_password=get_password_hash(password),
                is_active=True,
                is_superuser=True,
                role="ADMIN"
            )
            db.add(user)
            db.commit()
            print(f"Superuser created: {email}")
        else:
            print("Superuser already exists")
    finally:
        db.close()

if __name__ == "__main__":
    create_superuser()
