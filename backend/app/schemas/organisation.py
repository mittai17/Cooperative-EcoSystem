from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

# RICM = Regional Institute of Cooperative Management, ICM = Institute of
# Cooperative Management, VAMNICOM = Vaikunth Mehta National Institute of
# Cooperative Management. No fixed Indian-states enum exists elsewhere in the
# codebase (OrganisationUpdateRequest in app/schemas/user.py takes `state` as
# a plain string), so this follows the same plain-string convention.
OrganisationType = Literal["RICM", "ICM", "VAMNICOM", "other"]


class OrganisationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=255)
    type: OrganisationType
    state: str = Field(min_length=1, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=500)
    pincode: Optional[str] = Field(default=None, pattern=r"^\d{6}$")
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    website: Optional[HttpUrl] = None
    accreditation_number: Optional[str] = Field(default=None, max_length=100)
    logo_url: Optional[HttpUrl] = None
