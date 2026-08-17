"""Appointment business rules for the CLI MVP."""

from __future__ import annotations

import uuid
from datetime import date, datetime, time, timedelta
from pathlib import Path

from models import Appointment, Slot
from repository import JsonRepository
from validators import (
    ValidationError,
    normalize_email,
    normalize_name,
    normalize_reason,
    require_id,
)


class AppointmentError(Exception):
    """Expected business or validation error shown to the CLI user."""


class AppointmentService:
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"

    def __init__(self, repository: JsonRepository, seed_slots: bool = True):
        self.repository = repository
        self.data = repository.load()
        if seed_slots and not self.data["slots"]:
            self.data["slots"] = [slot.to_dict() for slot in build_default_slots()]
            self.repository.save(self.data)

    def slots(self) -> list[Slot]:
        return [Slot(**item) for item in self.data["slots"]]

    def appointments(self) -> list[Appointment]:
        return [Appointment(**item) for item in self.data["appointments"]]

    def available_slots(
        self,
        on_date: date | None = None,
        specialty: str | None = None,
    ) -> list[Slot]:
        booked_slot_ids = {
            appointment.slot_id
            for appointment in self.appointments()
            if appointment.appointment_status == self.BOOKED
        }
        specialty_filter = specialty.strip().lower() if specialty else None
        current_time = datetime.now().replace(second=0, microsecond=0)

        return sorted(
            [
                slot
                for slot in self.slots()
                if slot.id not in booked_slot_ids
                and slot.start >= current_time
                and (on_date is None or slot.start.date() == on_date)
                and (
                    specialty_filter is None
                    or specialty_filter in slot.specialty.lower()
                )
            ],
            key=lambda slot: slot.start,
        )

    def book(
        self,
        slot_id: str,
        patient_name: str,
        patient_email: str,
        reason: str = "",
    ) -> Appointment:
        try:
            slot_id = require_id(slot_id, "Slot ID")
            patient_name = normalize_name(patient_name)
            patient_email = normalize_email(patient_email)
            reason = normalize_reason(reason)
        except ValidationError as exc:
            raise AppointmentError(str(exc)) from exc

        slot = next((item for item in self.slots() if item.id == slot_id), None)
        if slot is None:
            raise AppointmentError(f"Slot '{slot_id}' was not found.")
        if slot.start < datetime.now().replace(second=0, microsecond=0):
            raise AppointmentError("That slot is in the past.")
        if any(
            appointment.slot_id == slot.id
            and appointment.appointment_status == self.BOOKED
            for appointment in self.appointments()
        ):
            raise AppointmentError("That slot has already been booked.")

        appointment = Appointment(
            id=f"APT-{uuid.uuid4().hex[:8].upper()}",
            slot_id=slot.id,
            patient_name=patient_name,
            patient_email=patient_email,
            reason=reason,
            appointment_status=self.BOOKED,
            created_at=datetime.now().isoformat(timespec="seconds"),
        )
        self.data["appointments"].append(appointment.to_dict())
        self.repository.save(self.data)
        return appointment

    def cancel(self, appointment_id: str) -> Appointment:
        try:
            appointment_id = require_id(appointment_id, "Appointment ID").upper()
        except ValidationError as exc:
            raise AppointmentError(str(exc)) from exc

        for raw_appointment in self.data["appointments"]:
            if raw_appointment.get("id", "").upper() == appointment_id:
                if raw_appointment.get("appointment_status") == self.CANCELLED:
                    raise AppointmentError("That appointment is already cancelled.")
                raw_appointment["appointment_status"] = self.CANCELLED
                self.repository.save(self.data)
                return Appointment(**raw_appointment)

        raise AppointmentError(f"Appointment '{appointment_id}' was not found.")

    def patient_appointments(self, patient_email: str) -> list[Appointment]:
        try:
            patient_email = normalize_email(patient_email)
        except ValidationError as exc:
            raise AppointmentError(str(exc)) from exc
        return sorted(
            [
                appointment
                for appointment in self.appointments()
                if appointment.patient_email == patient_email
            ],
            key=lambda appointment: appointment.created_at,
        )


def build_default_slots(today: date | None = None) -> list[Slot]:
    """Create demo slots for the next five business days."""
    current_day = today or date.today()
    providers = [
        ("Dr. Ada Okafor", "General Practice", time(9, 0)),
        ("Dr. Tunde Bello", "Pediatrics", time(10, 0)),
        ("Dr. Amara Nwosu", "Dermatology", time(11, 30)),
    ]
    slots: list[Slot] = []
    day_offset = 1
    slot_number = 1

    while len({slot.start.date() for slot in slots}) < 5:
        candidate = current_day + timedelta(days=day_offset)
        day_offset += 1
        if candidate.weekday() >= 5:
            continue
        for provider, specialty, start_time in providers:
            slots.append(
                Slot(
                    id=f"SLOT-{slot_number:03d}",
                    provider_name=provider,
                    specialty=specialty,
                    starts_at=datetime.combine(candidate, start_time).strftime("%Y-%m-%dT%H:%M"),
                )
            )
            slot_number += 1
    return slots
