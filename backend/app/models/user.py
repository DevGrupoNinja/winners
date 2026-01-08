from sqlalchemy import Boolean, Column, Integer, String
from app.db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    role = Column(String, default="COACH") # ADMIN, COACH, ATHLETE
    avatar_url = Column(String, nullable=True)
    cpf = Column(String, nullable=True)
    phone = Column(String, nullable=True)
