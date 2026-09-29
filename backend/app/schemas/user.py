from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

Role = Literal["trainee", "trainer", "institution", "employer", "admin", "ncct_admin"]


class UserSyncRequest(BaseModel):
    # Legacy clients may send profile fields; only Clerk's values are trusted.
    clerk_user_id: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    full_name: str | None = None
    role: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str | None = None
    role: str


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Role


class UserCreateRequest(BaseModel):
    """Institution-admin / admin creates a local trainee or trainer row that
    is not yet linked to a Clerk account (see `clerk_user_id` sentinel in
    app/api/v1/users.py). The real Clerk identity is attached automatically
    the first time that person signs in, via the same email-matching flow
    /auth/provision already uses."""
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    role: Literal["trainee", "trainer"]
    # Admin only: which organisation to create the user under. An
    # institution-admin is always forced to their own organisation_id
    # regardless of what (if anything) they send here.
    organisation_id: str | None = None
    # Trainee: optional batch to enroll into immediately.
    batch_id: str | None = None
    # Trainer: profile extras (stored on UserProfile, same fields the
    # trainer's own /profile page uses).
    qualification: str | None = Field(default=None, max_length=255)
    expertise: list[str] | None = None


class UserAdminUpdateRequest(BaseModel):
    """PATCH /users/{id}: admin may edit any field including role;
    institution-admin may edit non-role fields of a trainee/trainer in their
    own organisation only (enforced in the route, not here) - role must be
    omitted for that caller, this is intentionally NOT the anonymous
    `UserUpdateRequest.role` shortcut Codex locked down to admin-only."""
    model_config = ConfigDict(extra="forbid")
    full_name: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    role: Role | None = None
    qualification: str | None = Field(default=None, max_length=255)
    expertise: list[str] | None = None
    batch_id: str | None = None


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: str | None = Field(default=None, max_length=255)
    preferred_language: Literal["en", "hi", "mr", "gu", "ta"] | None = None
    career_target_role: str | None = Field(default=None, max_length=255)


class OrganisationUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=1, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    district: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, pattern=r"^\d{6}$")
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    website: HttpUrl | None = None
    accreditation_number: str | None = Field(default=None, max_length=100)
    logo_url: HttpUrl | None = None
