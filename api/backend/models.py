from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)

from datetime import datetime

try:
    from database import Base
except ImportError:
    from backend.database import Base


# --------------------------------------------------
# USER TABLE
# --------------------------------------------------

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )


# --------------------------------------------------
# BUS TABLE
# --------------------------------------------------

class Bus(Base):

    __tablename__ = "buses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    bus_number = Column(
        String,
        unique=True,
        nullable=False
    )

    source = Column(
        String,
        nullable=False
    )

    destination = Column(
        String,
        nullable=False
    )

    total_seats = Column(
        Integer,
        nullable=False
    )


# --------------------------------------------------
# BOOKING TABLE
# --------------------------------------------------

class Booking(Base):

    __tablename__ = "bookings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    bus_id = Column(
        Integer,
        ForeignKey("buses.id"),
        nullable=False
    )

    seat_number = Column(
        Integer,
        nullable=False
    )

    booking_status = Column(
        String,
        default="Booked"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# --------------------------------------------------
# DRIVER TABLE
# --------------------------------------------------

class Driver(Base):

    __tablename__ = "drivers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    license_number = Column(
        String,
        unique=True,
        nullable=False
    )

    phone = Column(
        String,
        unique=True,
        nullable=False
    )

    assigned_bus_id = Column(
        Integer,
        ForeignKey("buses.id"),
        nullable=True
    )


# --------------------------------------------------
# TRIP TABLE
# --------------------------------------------------

class Trip(Base):

    __tablename__ = "trips"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    bus_id = Column(
        Integer,
        ForeignKey("buses.id"),
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    latitude = Column(
        String,
        nullable=True
    )

    longitude = Column(
        String,
        nullable=True
    )

    speed = Column(
        String,
        nullable=True
    )

    route = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="NOT_STARTED"
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
