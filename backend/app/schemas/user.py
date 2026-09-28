from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class UserSyncRequest(BaseModel):
    """Body sent by the frontend right after Clerk auth to upsert the local
    user record (Clerk is the identity source of truth; this is our mirror)."""

    clerk_user_id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "trainee"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: Optional[str] = None
    role: str


class UserUpdateRequest(BaseModel):
    role: str
