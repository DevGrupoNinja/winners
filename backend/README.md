# Backend Documentation

## Initial Credentials

When setting up the project for the first time, use the following credentials to access the admin features:

- **Username**: `admin@winners.com`
- **Password**: `admin`

## Setup

1. Install dependencies: `pip install -r requirements.txt`
2. Run migrations/init db (handled by `main.py` currently for dev).
3. Run server: `python -m uvicorn app.main:app --reload --port 8001`
