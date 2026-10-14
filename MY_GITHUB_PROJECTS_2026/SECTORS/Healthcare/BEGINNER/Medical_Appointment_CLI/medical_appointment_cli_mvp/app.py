#!/usr/bin/env python3
"""Command-line interface for the Medical Appointment MVP."""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime
from pathlib import Path

from appointment_service import AppointmentError, AppointmentService
from models import Appointment, Slot
from repository import JsonRepository, RepositoryError

DATE_FORMAT = "%Y-%m-%d"
DEFAULT_STORE = Path(__file__).parent / "data" / "appointments.json"


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, DATE_FORMAT).date()
    except ValueError as exc:
        raise AppointmentError("Date must use YYYY-MM-DD format.") from exc


def format_slot(slot: Slot) -> str:
    return (
        f"{slot.id:<9} {slot.start:%a %d %b %Y %H:%M}  "
        f"{slot.provider_name:<20} {slot.specialty}"
    )


def format_appointment(appointment: Appointment, service: AppointmentService) -> str:
    slot = next((item for item in service.slots() if item.id == appointment.slot_id), None)
    if slot is None:
        date_time = appointment.slot_id
        provider = "Unknown provider"
        specialty = "Unknown specialty"
    else:
        date_time = slot.start.strftime("%a %d %b %Y %H:%M")
        provider = slot.provider_name
        specialty = slot.specialty
    return (
        f"{appointment.id:<13} {date_time:<22} {provider:<20} "
        f"{specialty:<18} {appointment.appointment_status}"
    )


def print_slots(slots: list[Slot]) -> None:
    if not slots:
        print("No available slots found.")
        return
    print("ID        DATE / TIME             PROVIDER             SPECIALTY")
    print("-" * 78)
    for slot in slots:
        print(format_slot(slot))


def print_appointments(appointments: list[Appointment], service: AppointmentService) -> None:
    if not appointments:
        print("No appointments found.")
        return
    print("ID            DATE / TIME             PROVIDER             SPECIALTY          STATUS")
    print("-" * 96)
    for appointment in appointments:
        print(format_appointment(appointment, service))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Book and cancel medical appointment slots."
    )
    parser.add_argument(
        "--store",
        type=Path,
        default=Path(os.environ.get("APPOINTMENT_STORE", DEFAULT_STORE)),
        help="JSON store path. Defaults to data/appointments.json.",
    )
    commands = parser.add_subparsers(dest="command")

    slots = commands.add_parser("slots", help="List available slots.")
    slots.add_argument("--date", help="Filter by YYYY-MM-DD.")
    slots.add_argument("--specialty", help="Filter by specialty.")

    book = commands.add_parser("book", help="Book an available slot.")
    book.add_argument("--slot", required=True, help="Slot ID, e.g. SLOT-001.")
    book.add_argument("--name", required=True, help="Patient full name.")
    book.add_argument("--email", required=True, help="Patient email.")
    book.add_argument("--reason", default="", help="Optional appointment reason.")

    appointments = commands.add_parser("appointments", help="View appointments.")
    appointments.add_argument("--email", help="Filter by patient email.")

    cancel = commands.add_parser("cancel", help="Cancel an appointment.")
    cancel.add_argument("appointment_id", help="Appointment confirmation ID.")

    commands.add_parser("interactive", help="Open the interactive menu.")
    return parser


def run_interactive(service: AppointmentService) -> None:
    print("Medical Appointment CLI MVP")
    print("Demo only — do not enter real patient data.\n")
    while True:
        print("1. List available slots")
        print("2. Book an appointment")
        print("3. View appointments by email")
        print("4. Cancel an appointment")
        print("5. Exit")
        choice = input("Choose an option: ").strip()
        print()
        try:
            if choice == "1":
                print_slots(service.available_slots())
            elif choice == "2":
                print_slots(service.available_slots())
                slot_id = input("Slot ID: ")
                name = input("Patient name: ")
                email = input("Patient email: ")
                reason = input("Reason (optional): ")
                appointment = service.book(slot_id, name, email, reason)
                print(f"Booked successfully. Confirmation ID: {appointment.id}")
            elif choice == "3":
                email = input("Patient email: ")
                print_appointments(service.patient_appointments(email), service)
            elif choice == "4":
                appointment_id = input("Appointment ID: ")
                appointment = service.cancel(appointment_id)
                print(f"Appointment {appointment.id} cancelled.")
            elif choice == "5":
                print("Goodbye.")
                return
            else:
                print("Please choose an option from 1 to 5.")
        except (AppointmentError, EOFError, KeyboardInterrupt) as exc:
            if isinstance(exc, (EOFError, KeyboardInterrupt)):
                print("\nGoodbye.")
                return
            print(f"Error: {exc}")
        print()


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        service = AppointmentService(JsonRepository(args.store))
        if args.command in (None, "interactive"):
            run_interactive(service)
            return 0

        if args.command == "slots":
            print_slots(service.available_slots(parse_date(args.date), args.specialty))
        elif args.command == "book":
            appointment = service.book(args.slot, args.name, args.email, args.reason)
            slot = next(item for item in service.slots() if item.id == appointment.slot_id)
            print("Appointment booked successfully.")
            print(f"Confirmation ID: {appointment.id}")
            print(f"Date and time:   {slot.start:%A, %d %B %Y at %H:%M}")
            print(f"Provider:        {slot.provider_name} ({slot.specialty})")
        elif args.command == "appointments":
            appointments = (
                service.patient_appointments(args.email)
                if args.email
                else service.appointments()
            )
            print_appointments(appointments, service)
        elif args.command == "cancel":
            appointment = service.cancel(args.appointment_id)
            print(f"Appointment {appointment.id} cancelled successfully.")
        else:
            parser.error(f"Unknown command: {args.command}")
    except (AppointmentError, RepositoryError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
