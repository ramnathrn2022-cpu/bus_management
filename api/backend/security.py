from jose import JWTError, jwt
from datetime import datetime, timedelta

from fastapi import (
    HTTPException,
    Depends,
    status
)

from fastapi.security import (
    OAuth2PasswordBearer
)


# --------------------------------------------------
# JWT CONFIGURATION
# --------------------------------------------------

import os

SECRET_KEY = os.environ.get("SECRET_KEY", "ramnath_bus_management_secret_key")

ALGORITHM = os.environ.get("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 60))



# --------------------------------------------------
# OAUTH2 SCHEME
# --------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# --------------------------------------------------
# CREATE ACCESS TOKEN
# --------------------------------------------------

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = (
            datetime.utcnow() +
            timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
    )

    to_encode.update(
        {"exp": expire}
    )

    encoded_jwt = jwt.encode(

        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM

    )

    return encoded_jwt


# --------------------------------------------------
# VERIFY TOKEN
# --------------------------------------------------

def verify_token(token: str):

    try:

        payload = jwt.decode(

            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]

        )

        return payload

    except JWTError:

        return None


# --------------------------------------------------
# GET CURRENT USER
# --------------------------------------------------

def get_current_user(

        token: str = Depends(
            oauth2_scheme
        )

):

    credentials_exception = HTTPException(

        status_code=status.HTTP_401_UNAUTHORIZED,

        detail="Invalid or Expired Token",

        headers={
            "WWW-Authenticate":
                "Bearer"
        }

    )

    payload = verify_token(token)

    if payload is None:

        raise credentials_exception

    return payload


# --------------------------------------------------
# OWNER AUTHENTICATION
# --------------------------------------------------

def get_current_owner(

        current_user=Depends(
            get_current_user
        )

):

    if (

            current_user.get("role")
            != "owner"

    ):

        raise HTTPException(

            status_code=403,

            detail=(
                "Only Owner "
                "can perform "
                "this operation."
            )

        )

    return current_user


# --------------------------------------------------
# MANAGER AUTHENTICATION
# --------------------------------------------------

def get_current_manager(

        current_user=Depends(
            get_current_user
        )

):

    if (

            current_user.get("role")
            != "manager"

    ):

        raise HTTPException(

            status_code=403,

            detail=(
                "Only Manager "
                "can perform "
                "this operation."
            )

        )

    return current_user


# --------------------------------------------------
# DRIVER AUTHENTICATION
# --------------------------------------------------

def get_current_driver(

        current_user=Depends(
            get_current_user
        )

):

    if (

            current_user.get("role")
            != "driver"

    ):

        raise HTTPException(

            status_code=403,

            detail=(
                "Only Driver "
                "can perform "
                "this operation."
            )

        )

    return current_user


# --------------------------------------------------
# NORMAL USER AUTHENTICATION
# --------------------------------------------------

def get_current_normal_user(

        current_user=Depends(
            get_current_user
        )

):

    if (

            current_user.get("role")
            != "user"

    ):

        raise HTTPException(

            status_code=403,

            detail=(
                "Only Users "
                "can perform "
                "this operation."
            )

        )

    return current_user


# --------------------------------------------------
# OWNER OR MANAGER
# --------------------------------------------------

def get_owner_or_manager(

        current_user=Depends(
            get_current_user
        )

):

    role = current_user.get("role")

    if role not in [

        "owner",
        "manager"

    ]:

        raise HTTPException(

            status_code=403,

            detail=(
                "Only Owner or "
                "Manager can "
                "access this "
                "resource."
            )

        )

    return current_user
