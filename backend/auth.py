import bcrypt
from passlib.context import CryptContext


# --------------------------------------------------
# PASSWORD HASHING CONFIGURATION
# --------------------------------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# --------------------------------------------------
# HASH PASSWORD
# --------------------------------------------------

def hash_password(password: str) -> str:
    """
    Converts normal password into
    encrypted bcrypt password.
    """
    try:
        pwd_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    except Exception:
        return pwd_context.hash(password)


# --------------------------------------------------
# VERIFY PASSWORD
# --------------------------------------------------

def verify_password(
        plain_password: str,
        hashed_password: str
) -> bool:
    """
    Verifies whether the entered
    password matches the stored
    encrypted password.
    """
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        if bcrypt.checkpw(pwd_bytes, hashed_bytes):
            return True
    except Exception:
        pass
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False



# --------------------------------------------------
# PASSWORD VALIDATION
# --------------------------------------------------

def validate_password(password: str):
    """
    Checks minimum password requirements.

    Conditions:
    --------------------
    Minimum Length = 8
    Must contain:
        - Uppercase
        - Lowercase
        - Number
    """

    if len(password) < 8:
        return False

    has_upper = False
    has_lower = False
    has_digit = False

    for character in password:

        if character.isupper():
            has_upper = True

        elif character.islower():
            has_lower = True

        elif character.isdigit():
            has_digit = True

    if (
            has_upper and
            has_lower and
            has_digit
    ):
        return True

    return False