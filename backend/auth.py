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

def hash_password(password: str):
    """
    Converts normal password into
    encrypted bcrypt password.
    """

    return pwd_context.hash(password)


# --------------------------------------------------
# VERIFY PASSWORD
# --------------------------------------------------

def verify_password(
        plain_password: str,
        hashed_password: str
):
    """
    Verifies whether the entered
    password matches the stored
    encrypted password.
    """

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


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