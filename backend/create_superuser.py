from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_superuser():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@winners.com").first()
        if not user:
            user = User(
                email="admin@winners.com",
                full_name="Admin",
                hashed_password=get_password_hash("admin"),
                is_active=True,
                is_superuser=True,
                role="ADMIN"
            )
            db.add(user)
            db.commit()
            print("Superuser created: admin@winners.com / admin")
        else:
            print("Superuser already exists")
    finally:
        db.close()

if __name__ == "__main__":
    create_superuser()
