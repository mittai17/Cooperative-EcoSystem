import secrets, string

def generate_verification_code() -> str:
    prefix = "CST-2026"
    suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    return f"{prefix}-{suffix}"
