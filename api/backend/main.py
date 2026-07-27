import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
import json
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session

from database import Base, engine, get_db

from models import User, Bus, Booking, Driver, Trip

from schemas import (
    UserCreate,
    UserLogin,
    Token,
    BusCreate,
    BusResponse,
    BookingCreate,
    BookingResponse,
    DriverCreate,
    DriverResponse,
    AssignDriver,
    AvailableSeats,
    TripCreate,
    TripResponse,
    LocationUpdate
)

from auth import hash_password, verify_password, validate_password

from security import (
    create_access_token,
    get_current_user,
    get_current_owner,
    get_current_driver,
    get_current_manager,
    get_current_normal_user,
    get_owner_or_manager,
)

from fastapi.middleware.cors import CORSMiddleware

# --------------------------------------------------
# CREATE DATABASE
# --------------------------------------------------

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print("Database metadata initialization notice:", e)


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(title="Bus Management System", version="1.0.0")

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class ApiPrefixMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            request.scope["path"] = request.url.path[4:]
        elif request.url.path == "/api":
            request.scope["path"] = "/"
        return await call_next(request)

app.add_middleware(ApiPrefixMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# HOME PAGE
# --------------------------------------------------


@app.get("/")
def home():

    return {
        "message": "Bus Management " "Backend Running Successfully.",
        "status": "ACTIVE",
    }


# --------------------------------------------------
# HEALTH CHECK API
# --------------------------------------------------


@app.get("/health")
def health_check():

    return {"server_status": "RUNNING", "database": "CONNECTED"}


# --------------------------------------------------
# USER REGISTRATION
# --------------------------------------------------


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    # CHECK EXISTING EMAIL

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:

        raise HTTPException(status_code=400, detail=("Email already exists."))

    # PASSWORD VALIDATION

    if not validate_password(user.password):

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must "
                "contain minimum "
                "8 characters "
                "including "
                "uppercase, "
                "lowercase "
                "and one number."
            ),
        )

    # ALLOWED ROLES

    allowed_roles = ["owner", "manager", "driver", "user"]

    if user.role.lower() not in allowed_roles:

        raise HTTPException(status_code=400, detail=("Invalid role."))

    # CREATE NEW USER

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role.lower(),
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {"message": "Registration Successful.", "user_id": new_user.id}


# --------------------------------------------------
# LOGIN API
# --------------------------------------------------


@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:

        raise HTTPException(status_code=401, detail="Invalid Credentials.")

    if not verify_password(user.password, db_user.password):

        raise HTTPException(status_code=401, detail="Invalid Credentials.")

    access_token = create_access_token(
        {"sub": db_user.email, "role": db_user.role, "user_id": db_user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "user_id": db_user.id,
    }


# --------------------------------------------------
# CURRENT USER DETAILS
# --------------------------------------------------


@app.get("/me")
def get_my_profile(current_user=Depends(get_current_user)):

    return current_user


# --------------------------------------------------
# ADD BUS
# OWNER ONLY
# --------------------------------------------------


@app.post("/add-bus", response_model=BusResponse)
def add_bus(
    bus: BusCreate,
    current_owner=Depends(get_current_owner),
    db: Session = Depends(get_db),
):

    existing_bus = db.query(Bus).filter(Bus.bus_number == bus.bus_number).first()

    if existing_bus:

        raise HTTPException(status_code=400, detail="Bus already exists.")

    new_bus = Bus(
        bus_number=bus.bus_number,
        source=bus.source,
        destination=bus.destination,
        total_seats=bus.total_seats,
    )

    db.add(new_bus)

    db.commit()

    db.refresh(new_bus)

    return new_bus


# --------------------------------------------------
# VIEW ALL BUSES
# --------------------------------------------------


@app.get("/buses", response_model=list[BusResponse])
def get_all_buses(db: Session = Depends(get_db)):

    buses = db.query(Bus).all()

    return buses


# --------------------------------------------------
# GET SINGLE BUS
# --------------------------------------------------


@app.get("/bus/{bus_id}", response_model=BusResponse)
def get_bus(bus_id: int, db: Session = Depends(get_db)):

    bus = db.query(Bus).filter(Bus.id == bus_id).first()

    if not bus:

        raise HTTPException(status_code=404, detail="Bus not found.")

    return bus


# --------------------------------------------------
# DELETE BUS
# OWNER ONLY
# --------------------------------------------------


@app.delete("/bus/{bus_id}")
def delete_bus(
    bus_id: int, current_owner=Depends(get_current_owner), db: Session = Depends(get_db)
):

    bus = db.query(Bus).filter(Bus.id == bus_id).first()

    if not bus:

        raise HTTPException(status_code=404, detail="Bus not found.")

    # CHECK BOOKINGS

    existing_booking = db.query(Booking).filter(Booking.bus_id == bus_id).first()

    if existing_booking:

        raise HTTPException(
            status_code=400,
            detail=("Cannot delete bus." " Tickets are already " "booked."),
        )

    db.delete(bus)

    db.commit()

    return {"message": "Bus deleted successfully."}


# --------------------------------------------------
# AVAILABLE SEATS
# --------------------------------------------------


@app.get("/available-seats/{bus_id}", response_model=AvailableSeats)
def get_available_seats(bus_id: int, db: Session = Depends(get_db)):

    bus = db.query(Bus).filter(Bus.id == bus_id).first()

    if not bus:

        raise HTTPException(status_code=404, detail="Bus not found.")

    bookings = db.query(Booking).filter(Booking.bus_id == bus_id).all()

    booked_seats = [booking.seat_number for booking in bookings]

    available_seats = []

    for seat in range(1, bus.total_seats + 1):

        if seat not in booked_seats:

            available_seats.append(seat)

    remaining_seats = len(available_seats)

    return {"remaining_seats": remaining_seats, "available_seats": available_seats}


# --------------------------------------------------
# TOTAL BOOKINGS OF A BUS
# --------------------------------------------------


@app.get("/bus-bookings/{bus_id}")
def total_bus_bookings(
    bus_id: int,
    current_user=Depends(get_owner_or_manager),
    db: Session = Depends(get_db),
):

    total_bookings = db.query(Booking).filter(Booking.bus_id == bus_id).count()

    return {"bus_id": bus_id, "total_bookings": total_bookings}


# --------------------------------------------------
# BOOK TICKET
# USER ONLY
# --------------------------------------------------


@app.post("/book-ticket", response_model=BookingResponse)
def book_ticket(
    booking: BookingCreate,
    current_user=Depends(get_current_normal_user),
    db: Session = Depends(get_db),
):

    # -------------------------------------
    # CHECK USER EXISTS
    # -------------------------------------

    user = db.query(User).filter(User.id == booking.user_id).first()

    if not user:

        raise HTTPException(status_code=404, detail="User not found.")

    # -------------------------------------
    # SECURITY CHECK
    # -------------------------------------

    if current_user.get("user_id") != booking.user_id:

        raise HTTPException(
            status_code=403, detail=("You cannot " "book tickets " "for another user.")
        )

    # -------------------------------------
    # CHECK BUS EXISTS
    # -------------------------------------

    bus = db.query(Bus).filter(Bus.id == booking.bus_id).first()

    if not bus:

        raise HTTPException(status_code=404, detail="Bus not found.")

    # -------------------------------------
    # CHECK SEAT LIMIT
    # -------------------------------------

    if booking.seat_number > bus.total_seats:

        raise HTTPException(
            status_code=400, detail=("Seat number exceeds " "total bus capacity.")
        )

    # -------------------------------------
    # CHECK SEAT AVAILABILITY
    # -------------------------------------

    existing_booking = (
        db.query(Booking)
        .filter(
            Booking.bus_id == booking.bus_id, Booking.seat_number == booking.seat_number
        )
        .first()
    )

    if existing_booking:

        raise HTTPException(status_code=400, detail="Seat already booked.")

    # -------------------------------------
    # CREATE BOOKING
    # -------------------------------------

    new_booking = Booking(
        user_id=booking.user_id,
        bus_id=booking.bus_id,
        seat_number=booking.seat_number,
        booking_status="Booked",
    )

    db.add(new_booking)

    db.commit()

    db.refresh(new_booking)

    return new_booking


# --------------------------------------------------
# VIEW ALL BOOKINGS
# OWNER + MANAGER ONLY
# --------------------------------------------------


@app.get("/tickets")
def get_all_tickets(
    current_user=Depends(get_owner_or_manager), db: Session = Depends(get_db)
):

    bookings = db.query(Booking).all()

    return bookings


# --------------------------------------------------
# VIEW MY BOOKINGS
# USER ONLY
# --------------------------------------------------


@app.get("/my-tickets")
def get_my_tickets(
    current_user=Depends(get_current_normal_user), db: Session = Depends(get_db)
):

    user_id = current_user.get("user_id")

    tickets = db.query(Booking).filter(Booking.user_id == user_id).all()

    return tickets


# --------------------------------------------------
# GET SINGLE TICKET
# --------------------------------------------------


@app.get("/ticket/{ticket_id}")
def get_single_ticket(
    ticket_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    ticket = db.query(Booking).filter(Booking.id == ticket_id).first()

    if not ticket:

        raise HTTPException(status_code=404, detail="Ticket not found.")

    return ticket


# --------------------------------------------------
# CANCEL TICKET
# USER ONLY
# --------------------------------------------------


@app.delete("/ticket/{ticket_id}")
def cancel_ticket(
    ticket_id: int,
    current_user=Depends(get_current_normal_user),
    db: Session = Depends(get_db),
):

    ticket = db.query(Booking).filter(Booking.id == ticket_id).first()

    if not ticket:

        raise HTTPException(status_code=404, detail="Ticket not found.")

    # ------------------------------------
    # SECURITY CHECK
    # ------------------------------------

    if ticket.user_id != current_user.get("user_id"):

        raise HTTPException(
            status_code=403, detail=("You can only " "cancel your " "own ticket.")
        )

    db.delete(ticket)

    db.commit()

    return {"message": "Ticket cancelled " "successfully."}


# --------------------------------------------------
# TOTAL BOOKINGS
# --------------------------------------------------


@app.get("/total-bookings")
def total_bookings(
    current_user=Depends(get_owner_or_manager), db: Session = Depends(get_db)
):

    total = db.query(Booking).count()

    return {"total_bookings": total}


# --------------------------------------------------
# ADD DRIVER
# OWNER ONLY
# --------------------------------------------------


@app.post("/add-driver", response_model=DriverResponse)
def add_driver(
    driver: DriverCreate,
    current_owner=Depends(get_current_owner),
    db: Session = Depends(get_db),
):

    # CHECK USER EXISTS

    user = db.query(User).filter(User.id == driver.user_id).first()

    if not user:

        raise HTTPException(status_code=404, detail="User not found.")

    # CHECK ROLE

    if user.role != "driver":

        raise HTTPException(
            status_code=400,
            detail=("Selected user " "is not registered " "as a driver."),
        )

    # CHECK LICENSE

    existing_license = (
        db.query(Driver).filter(Driver.license_number == driver.license_number).first()
    )

    if existing_license:

        raise HTTPException(status_code=400, detail="License already exists.")

    # CHECK PHONE NUMBER

    existing_phone = db.query(Driver).filter(Driver.phone == driver.phone).first()

    if existing_phone:

        raise HTTPException(status_code=400, detail="Phone number already exists.")

    # CHECK IF DRIVER ALREADY EXISTS

    existing_driver = db.query(Driver).filter(Driver.user_id == driver.user_id).first()

    if existing_driver:

        raise HTTPException(status_code=400, detail="Driver already added.")

    # CREATE DRIVER

    new_driver = Driver(
        user_id=driver.user_id, license_number=driver.license_number, phone=driver.phone
    )

    db.add(new_driver)

    db.commit()

    db.refresh(new_driver)

    return new_driver


# --------------------------------------------------
# ASSIGN DRIVER
# OWNER ONLY
# --------------------------------------------------


@app.post("/assign-driver")
def assign_driver(
    data: AssignDriver,
    current_owner=Depends(get_current_owner),
    db: Session = Depends(get_db),
):

    driver = db.query(Driver).filter(Driver.id == data.driver_id).first()

    if not driver:

        raise HTTPException(status_code=404, detail="Driver not found.")

    bus = db.query(Bus).filter(Bus.id == data.bus_id).first()

    if not bus:

        raise HTTPException(status_code=404, detail="Bus not found.")

    # ASSIGN DRIVER

    driver.assigned_bus_id = data.bus_id

    db.commit()

    return {"message": "Driver assigned " "successfully."}


# --------------------------------------------------
# VIEW ALL DRIVERS
# --------------------------------------------------


@app.get("/drivers", response_model=list[DriverResponse])
def get_all_drivers(
    current_user=Depends(get_owner_or_manager), db: Session = Depends(get_db)
):

    drivers = db.query(Driver).all()

    return drivers


# --------------------------------------------------
# VIEW SINGLE DRIVER
# --------------------------------------------------


@app.get("/driver/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    current_user=Depends(get_owner_or_manager),
    db: Session = Depends(get_db),
):

    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:

        raise HTTPException(status_code=404, detail="Driver not found.")

    return driver


# --------------------------------------------------
# REMOVE DRIVER
# OWNER ONLY
# --------------------------------------------------


@app.delete("/driver/{driver_id}")
def remove_driver(
    driver_id: int,
    current_owner=Depends(get_current_owner),
    db: Session = Depends(get_db),
):

    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:

        raise HTTPException(status_code=404, detail="Driver not found.")

    db.delete(driver)

    db.commit()

    return {"message": "Driver removed successfully."}


# --------------------------------------------------
# DRIVER'S ASSIGNED BUS
# --------------------------------------------------

@app.get("/my-bus")
def get_assigned_bus(
    current_driver=Depends(get_current_driver), db: Session = Depends(get_db)
):

    user_id = current_driver.get("user_id")

    driver = db.query(Driver).filter(Driver.user_id == user_id).first()

    if not driver:

        raise HTTPException(status_code=404, detail="Driver not found.")

    if driver.assigned_bus_id is None:

        return {"message": "No bus assigned."}

    bus = db.query(Bus).filter(Bus.id == driver.assigned_bus_id).first()

    if not bus:

        return {"message": "Assigned bus not available."}

    return {
        "driver_id": driver.id,
        "bus_id": bus.id,
        "bus_number": bus.bus_number,
        "source": bus.source,
        "destination": bus.destination,
        "total_seats": bus.total_seats,
    }


# --------------------------------------------------
# WEBSOCKET CONNECTION MANAGER
# --------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()


@app.websocket("/ws/track")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# --------------------------------------------------
# TRIP MANAGEMENT APIS
# --------------------------------------------------

@app.post("/trips/start", response_model=TripResponse)
def start_trip(data: TripCreate, db: Session = Depends(get_db)):
    # Verify bus and driver exist
    bus = db.query(Bus).filter(Bus.id == data.bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found.")
        
    driver = db.query(Driver).filter(Driver.id == data.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")

    # Check if there is an active trip for this bus or driver
    active_trip = db.query(Trip).filter(
        (Trip.bus_id == data.bus_id) | (Trip.driver_id == data.driver_id),
        Trip.status.in_(["ACTIVE", "PAUSED"])
    ).first()
    
    if active_trip:
        return active_trip
        
    route_str = f"{bus.source.title()} -> {bus.destination.title()}"
    new_trip = Trip(
        bus_id=data.bus_id,
        driver_id=data.driver_id,
        status="ACTIVE",
        latitude=None,
        longitude=None,
        speed="0",
        route=route_str,
        timestamp=datetime.utcnow()
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip


@app.post("/trips/update-location")
async def update_location(data: LocationUpdate, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == data.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
        
    trip.latitude = data.latitude
    trip.longitude = data.longitude
    trip.speed = data.speed
    trip.status = data.status
    trip.timestamp = datetime.utcnow()
    db.commit()
    
    # Fetch bus details to include in broadcast
    bus = db.query(Bus).filter(Bus.id == trip.bus_id).first()
    bus_number = bus.bus_number if bus else "Unknown"
    source = bus.source if bus else "Unknown"
    destination = bus.destination if bus else "Unknown"

    # Broadcast location update over WebSocket
    payload = {
        "trip_id": trip.id,
        "bus_id": trip.bus_id,
        "bus_number": bus_number,
        "driver_id": trip.driver_id,
        "latitude": trip.latitude,
        "longitude": trip.longitude,
        "speed": trip.speed,
        "status": trip.status,
        "source": source,
        "destination": destination,
        "route": trip.route,
        "timestamp": trip.timestamp.isoformat() if trip.timestamp else ""
    }
    await manager.broadcast(payload)
    return {"message": "Location updated and broadcasted successfully.", "trip_id": trip.id}


@app.post("/trips/update-status")
async def update_status(trip_id: int, status: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    
    trip.status = status
    trip.timestamp = datetime.utcnow()
    db.commit()
    
    # Fetch bus details to include in broadcast
    bus = db.query(Bus).filter(Bus.id == trip.bus_id).first()
    bus_number = bus.bus_number if bus else "Unknown"
    source = bus.source if bus else "Unknown"
    destination = bus.destination if bus else "Unknown"

    # Broadcast location update over WebSocket
    payload = {
        "trip_id": trip.id,
        "bus_id": trip.bus_id,
        "bus_number": bus_number,
        "driver_id": trip.driver_id,
        "latitude": trip.latitude,
        "longitude": trip.longitude,
        "speed": trip.speed,
        "status": trip.status,
        "source": source,
        "destination": destination,
        "route": trip.route,
        "timestamp": trip.timestamp.isoformat() if trip.timestamp else ""
    }
    await manager.broadcast(payload)
    return {"message": "Trip status updated and broadcasted successfully.", "trip_id": trip.id, "status": trip.status}


@app.get("/trips/active", response_model=list[TripResponse])
def get_active_trips(db: Session = Depends(get_db)):
    return db.query(Trip).filter(Trip.status == "ACTIVE").all()


@app.get("/trips/driver/{driver_id}/active", response_model=Optional[TripResponse])
def get_driver_active_trip(driver_id: int, db: Session = Depends(get_db)):
    return db.query(Trip).filter(Trip.driver_id == driver_id, Trip.status.in_(["ACTIVE", "PAUSED"])).first()


@app.get("/trips/bus/{bus_id}/active", response_model=Optional[TripResponse])
def get_bus_active_trip(bus_id: int, db: Session = Depends(get_db)):
    return db.query(Trip).filter(Trip.bus_id == bus_id, Trip.status.in_(["ACTIVE", "PAUSED"])).first()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

