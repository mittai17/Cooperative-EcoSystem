from pydantic import BaseModel


class AllocateRequest(BaseModel):
    waitlist_id: str
    room_id: str
