#!/bin/sh

set -e

# Wait for DB to be potentially ready (simple wait, or use a wait-for-it script if preferred)
echo "Waiting for database..."
# Simple wait loop if needed, but for now we rely on depends_on: condition: service_healthy in compose or just fail/restart
# Or we can use `nc` to check port if we knew the host.
# Assuming 'db' is the hostname from docker-compose

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Create superuser
echo "Creating superuser..."
python create_superuser.py

# Start application
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
