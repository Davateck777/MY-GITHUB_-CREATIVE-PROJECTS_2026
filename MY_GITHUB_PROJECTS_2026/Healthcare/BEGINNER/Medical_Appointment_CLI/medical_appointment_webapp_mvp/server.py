#!/usr/bin/env python3
"""Dependency-free HTTP server for the Medical Appointment WebApp MVP."""

from __future__ import annotations

import json
import mimetypes
import os
import re
from datetime import date, datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from appointment_service import AppointmentError, AppointmentService
from models import Appointment, Slot
from repository import JsonRepository, RepositoryError

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
DEFAULT_STORE = APP_DIR / "data" / "appointments.json"
STORE_PATH = Path(os.environ.get("APPOINTMENT_STORE", DEFAULT_STORE))
DATE_FORMAT = "%Y-%m-%d"

service = AppointmentService(JsonRepository(STORE_PATH))


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, DATE_FORMAT).date()
    except ValueError as exc:
        raise AppointmentError("Date must use YYYY-MM-DD format.") from exc


def serialize_slot(slot: Slot) -> dict:
    return {
        "id": slot.id,
        "providerName": slot.provider_name,
        "specialty": slot.specialty,
        "startsAt": slot.starts_at,
        "durationMinutes": slot.duration_minutes,
    }


def serialize_appointment(appointment: Appointment) -> dict:
    slot = next(
        (item for item in service.slots() if item.id == appointment.slot_id),
        None,
    )
    return {
        "id": appointment.id,
        "slotId": appointment.slot_id,
        "patientName": appointment.patient_name,
        "patientEmail": appointment.patient_email,
        "reason": appointment.reason,
        "status": appointment.appointment_status,
        "createdAt": appointment.created_at,
        "providerName": slot.provider_name if slot else "Unknown provider",
        "specialty": slot.specialty if slot else "Unknown specialty",
        "startsAt": slot.starts_at if slot else None,
    }


class WebAppHandler(BaseHTTPRequestHandler):
    server_version = "MedicalAppointmentWebApp/1.0"

    def log_message(self, format: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")

    def _send_json(self, payload: dict | list, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _send_error(self, message: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST) -> None:
        self._send_json({"error": message}, status)

    def _read_json(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw_body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise AppointmentError("Request body must be valid JSON.") from exc
        if not isinstance(payload, dict):
            raise AppointmentError("Request body must be a JSON object.")
        return payload

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_HEAD(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._send_json({}, HTTPStatus.OK)
        else:
            self._serve_static(parsed.path)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        query = parse_qs(parsed.query)
        try:
            if path == "/api/health":
                self._send_json({"status": "ok", "service": "medical-appointment-webapp-mvp"})
                return

            if path == "/api/slots":
                slots = service.available_slots(
                    parse_date(query.get("date", [None])[0]),
                    query.get("specialty", [None])[0],
                )
                self._send_json({"slots": [serialize_slot(item) for item in slots]})
                return

            if path == "/api/appointments":
                email = query.get("email", [None])[0]
                appointments = (
                    service.patient_appointments(email)
                    if email
                    else service.appointments()
                )
                self._send_json({"appointments": [serialize_appointment(item) for item in appointments]})
                return

            self._serve_static(path)
        except (AppointmentError, RepositoryError) as exc:
            self._send_error(str(exc))

    def do_POST(self) -> None:
        path = unquote(urlparse(self.path).path).rstrip("/")
        try:
            payload = self._read_json()
            if path == "/api/appointments":
                appointment = service.book(
                    payload.get("slotId", ""),
                    payload.get("patientName", ""),
                    payload.get("patientEmail", ""),
                    payload.get("reason", ""),
                )
                self._send_json(
                    {"appointment": serialize_appointment(appointment)},
                    HTTPStatus.CREATED,
                )
                return

            match = re.fullmatch(r"/api/appointments/([^/]+)/cancel", path)
            if match:
                appointment = service.cancel(match.group(1))
                self._send_json({"appointment": serialize_appointment(appointment)})
                return

            self._send_error("API route not found.", HTTPStatus.NOT_FOUND)
        except (AppointmentError, RepositoryError) as exc:
            status = (
                HTTPStatus.CONFLICT
                if "already been booked" in str(exc).lower()
                else HTTPStatus.BAD_REQUEST
            )
            self._send_error(str(exc), status)

    def _serve_static(self, path: str) -> None:
        relative_path = "index.html" if path in ("", "/") else path.lstrip("/")
        if relative_path.startswith("api/") or ".." in Path(relative_path).parts:
            self._send_error("Not found.", HTTPStatus.NOT_FOUND)
            return

        file_path = (STATIC_DIR / relative_path).resolve()
        static_root = STATIC_DIR.resolve()
        if static_root not in file_path.parents and file_path != static_root:
            self._send_error("Not found.", HTTPStatus.NOT_FOUND)
            return
        if not file_path.is_file():
            self._send_error("Not found.", HTTPStatus.NOT_FOUND)
            return

        content = file_path.read_bytes()
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header(
            "Content-Type",
            f"{content_type}; charset=utf-8" if content_type.startswith("text/") else content_type,
        )
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)


def main() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), WebAppHandler)
    print(f"Medical Appointment WebApp running at http://{host}:{port}")
    print(f"JSON store: {STORE_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
