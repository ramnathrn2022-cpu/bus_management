from pydantic import (
    BaseModel,
    EmailStr,
    Field
)

from typing import Optional
from datetime import datetime


# --------------------------------------------------
# USER REGISTRATION
# --------------------------------------------------

class UserCreate(BaseModel):

    name: str

    email: EmailStr

    password: str

    role: str


# --------------------------------------------------
# USER LOGIN
# --------------------------------------------------

class UserLogin(BaseModel):

    email: EmailStr

    password: str


# --------------------------------------------------
# JWT TOKEN
# --------------------------------------------------

class Token(BaseModel):

    access_token:str

    token_type:str

    role:str

    user_id:int

# --------------------------------------------------
# BUS DETAILS
# --------------------------------------------------

class BusCreate(BaseModel):

    bus_number: str

    source: str

    destination: str

    total_seats: int = Field(
        gt=0,
        description="Total seats must be greater than zero."
    )


# --------------------------------------------------
# BOOKING DETAILS
# --------------------------------------------------

class BookingCreate(BaseModel):

    user_id: int

    bus_id: int

    seat_number: int = Field(
        gt=0,
        description="Seat number should be greater than zero."
    )


# --------------------------------------------------
# DRIVER DETAILS
# --------------------------------------------------

class DriverCreate(BaseModel):

    user_id: int

    license_number: str

    phone: str


# --------------------------------------------------
# ASSIGN DRIVER
# --------------------------------------------------

class AssignDriver(BaseModel):

    driver_id: int

    bus_id: int


# --------------------------------------------------
# AVAILABLE SEATS
# --------------------------------------------------

class AvailableSeats(BaseModel):

    remaining_seats: int

    available_seats: list[int]


# --------------------------------------------------
# USER RESPONSE
# --------------------------------------------------

class UserResponse(BaseModel):

    id: int

    name: str

    email: EmailStr

    role: str

    class Config:
        from_attributes = True


# --------------------------------------------------
# BUS RESPONSE
# --------------------------------------------------

class BusResponse(BaseModel):

    id: int

    bus_number: str

    source: str

    destination: str

    total_seats: int

    class Config:
        from_attributes = True


# --------------------------------------------------
# BOOKING RESPONSE
# --------------------------------------------------

class BookingResponse(BaseModel):

    id: int

    user_id: int

    bus_id: int

    seat_number: int

    booking_status: str

    class Config:
        from_attributes = True


# --------------------------------------------------
# DRIVER RESPONSE
# --------------------------------------------------

class DriverResponse(BaseModel):

    id: int

    user_id: int

    license_number: str

    phone: str

    assigned_bus_id: Optional[int]

    class Config:
        from_attributes = True


# --------------------------------------------------
# TRIP DETAILS
# --------------------------------------------------

class TripCreate(BaseModel):

    bus_id: int

    driver_id: int


class TripResponse(BaseModel):

    id: int

    bus_id: int

    driver_id: int

    latitude: Optional[str] = None

    longitude: Optional[str] = None

    speed: Optional[str] = None

    route: Optional[str] = None

    status: str

    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class LocationUpdate(BaseModel):

    driver_id: int

    bus_id: int

    trip_id: int

    latitude: str

    longitude: str

    speed: str

    timestamp: Optional[str] = None

    status: str
