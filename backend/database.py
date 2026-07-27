from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker


import os

# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
elif os.environ.get("VERCEL") or os.environ.get("RENDER"):
    os.makedirs("/tmp", exist_ok=True)
    DATABASE_URL = "sqlite:////tmp/bus_booking.db"
else:
    DATABASE_URL = "sqlite:///./bus_booking.db"

# --------------------------------------------------
# DATABASE ENGINE
# --------------------------------------------------

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)


# --------------------------------------------------
# SESSION CONFIGURATION
# --------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# --------------------------------------------------
# BASE CLASS
# --------------------------------------------------

Base = declarative_base()


# --------------------------------------------------
# DATABASE DEPENDENCY
# --------------------------------------------------

def get_db():
    """
    Creates a database session.

    Automatically closes the
    session after completion.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()