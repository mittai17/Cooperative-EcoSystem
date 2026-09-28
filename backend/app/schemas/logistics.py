from pydantic import BaseModel, Field
from typing import Literal

LogisticsCategory = Literal["Travel", "Catering", "Materials", "Venue", "Equipment"]


class LogisticsTaskCreate(BaseModel):
    title: str = Field(min_length=5)
    category: LogisticsCategory
    programme_id: str
    owner: str = Field(min_length=3)
    due_date: str
    estimated_cost: int = Field(0, ge=0)


class LogisticsTaskUpdate(BaseModel):
    done: bool
