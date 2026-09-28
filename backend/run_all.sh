#!/bin/bash
export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
export PYTHONPATH=/home/mittai/Documents/Cooperative-EcoSystem/backend

alembic revision --autogenerate -m "initial_schema"
alembic upgrade head

python -m app.seed

python -m pytest tests/ -v

nohup uvicorn app.main:app --reload --port 8000 &
sleep 5

curl -s http://localhost:8000/health
echo "\n"
curl -s http://localhost:8000/api/v1/skills/roles
echo "\n"
curl -s http://localhost:8000/docs | head -20
