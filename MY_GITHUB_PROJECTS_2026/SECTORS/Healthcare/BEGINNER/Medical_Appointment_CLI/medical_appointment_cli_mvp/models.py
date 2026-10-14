"""Data models for the medical appointment CLI MVP."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime

DATETIME_FORMAT = "%Y-%m-%dT%H:%M"


@dataclass(frozen=True)
class Slot:
    id: str
    provider_name: str
    specialty: str
    starts_at: str
    duration_minutes: int = 30

    @property
    def start(self) -> datetime:
        return datetime.strptime(self.starts_at, DATETIME_FORMAT)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Appointment:
    id: str
    slot_id: str
    patient_name: str
    patient_email: str
    reason: str
    appointment_status: str
    created_at: str

    def to_dict(self) -> dict:
        return asdict(self)
