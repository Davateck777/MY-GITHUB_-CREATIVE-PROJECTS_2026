from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from appointment_service import AppointmentError, AppointmentService, build_default_slots
from repository import JsonRepository


class AppointmentServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store_path = Path(self.temp_dir.name) / "appointments.json"
        self.service = AppointmentService(JsonRepository(self.store_path))

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_default_slots_are_seeded(self) -> None:
        slots = self.service.available_slots()
        self.assertGreater(len(slots), 0)
        self.assertTrue(all(slot.id.startswith("SLOT-") for slot in slots))

    def test_booked_slot_is_removed_from_availability(self) -> None:
        slot = self.service.available_slots()[0]
        appointment = self.service.book(
            slot.id,
            "Demo Patient",
            "demo@example.com",
            "Routine consultation",
        )
        self.assertEqual(appointment.slot_id, slot.id)
        self.assertNotIn(slot.id, {item.id for item in self.service.available_slots()})

    def test_duplicate_booking_is_rejected(self) -> None:
        slot = self.service.available_slots()[0]
        self.service.book(slot.id, "First Patient", "first@example.com")
        with self.assertRaisesRegex(AppointmentError, "already been booked"):
            self.service.book(slot.id, "Second Patient", "second@example.com")

    def test_cancel_releases_slot(self) -> None:
        slot = self.service.available_slots()[0]
        appointment = self.service.book(slot.id, "Demo Patient", "demo@example.com")
        cancelled = self.service.cancel(appointment.id)
        self.assertEqual(cancelled.appointment_status, "CANCELLED")
        self.assertIn(slot.id, {item.id for item in self.service.available_slots()})

    def test_cancel_is_idempotency_safe(self) -> None:
        slot = self.service.available_slots()[0]
        appointment = self.service.book(slot.id, "Demo Patient", "demo@example.com")
        self.service.cancel(appointment.id)
        with self.assertRaisesRegex(AppointmentError, "already cancelled"):
            self.service.cancel(appointment.id)

    def test_invalid_email_is_rejected(self) -> None:
        slot = self.service.available_slots()[0]
        with self.assertRaisesRegex(AppointmentError, "valid email"):
            self.service.book(slot.id, "Demo Patient", "not-an-email")

    def test_patient_appointments_are_filtered(self) -> None:
        first_slot, second_slot = self.service.available_slots()[:2]
        self.service.book(first_slot.id, "First Patient", "first@example.com")
        self.service.book(second_slot.id, "Second Patient", "second@example.com")
        results = self.service.patient_appointments("FIRST@EXAMPLE.COM")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].patient_name, "First Patient")

    def test_data_is_persisted(self) -> None:
        slot = self.service.available_slots()[0]
        appointment = self.service.book(slot.id, "Demo Patient", "demo@example.com")
        reloaded = AppointmentService(JsonRepository(self.store_path), seed_slots=False)
        self.assertEqual(reloaded.appointments()[0].id, appointment.id)
        payload = json.loads(self.store_path.read_text(encoding="utf-8"))
        self.assertEqual(payload["appointments"][0]["appointment_status"], "BOOKED")

    def test_default_slot_builder_produces_five_business_days(self) -> None:
        slots = build_default_slots()
        days = {slot.start.date() for slot in slots}
        self.assertEqual(len(days), 5)
        self.assertTrue(all(slot.start.weekday() < 5 for slot in slots))


if __name__ == "__main__":
    unittest.main()
