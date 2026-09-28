from pydantic import BaseModel, Field
from typing import Optional, List


class GenerateQRRequest(BaseModel):
    session_name: str
    programme_id: str
    valid_minutes: int = Field(30, gt=0, le=480)


class GenerateQRResponse(BaseModel):
    qr_token: str
    session_id: str
    valid_minutes: int
    qr_data: str


class ScanQRRequest(BaseModel):
    qr_token: str
    trainee_id: str


class ScanQRResponse(BaseModel):
    status: str
    session: Optional[str] = None
    trainee_id: str
    marked_at: str


class AttendanceRecordEntry(BaseModel):
    date: str
    session: str
    status: str
    method: str


class AttendanceSummaryResponse(BaseModel):
    records: List[AttendanceRecordEntry]
    overall_percentage: float
    total_sessions: int
    present: int
