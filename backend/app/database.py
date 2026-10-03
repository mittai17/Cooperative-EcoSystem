from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from app.config import get_settings

settings = get_settings()

# async engine for server
async_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://").replace("?sslmode=require", "")
engine = create_async_engine(async_url, poolclass=NullPool, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# sync engine for alembic
sync_url = settings.database_url.replace("postgresql://", "postgresql+psycopg://")
sync_engine = create_engine(sync_url, poolclass=NullPool)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
