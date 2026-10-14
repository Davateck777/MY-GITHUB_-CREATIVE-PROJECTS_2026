# Medical Appointment CLI MVP

A small, dependency-free Python CLI for managing appointment slots.

## MVP use cases

1. List available slots
2. Book an available slot
3. View appointments by patient email
4. Cancel an appointment
5. Persist data between runs

## Requirements

- Python 3.10+
- Python standard library only

## Run the interactive CLI

```bash
cd medical_appointment_cli_mvp
python app.py
```

The interactive menu supports listing slots, booking, viewing appointments, cancelling, and exiting.

## Command mode

List available slots:

```bash
python app.py slots
```

Filter slots:

```bash
python app.py slots --date 2026-08-19 --specialty "General Practice"
```

Book a slot:

```bash
python app.py book \
  --slot SLOT-001 \
  --name "Demo Patient" \
  --email demo@example.com \
  --reason "Routine consultation"
```

View all appointments:

```bash
python app.py appointments
```

View appointments for one patient:

```bash
python app.py appointments --email demo@example.com
```

Cancel an appointment:

```bash
python app.py cancel APT-XXXXXXXX
```

## Store location

By default, data is stored in:

```text
data/appointments.json
```

Use a different store during testing:

```bash
python app.py --store /tmp/appointments.json slots
```

or:

```bash
APPOINTMENT_STORE=/tmp/appointments.json python app.py
```

## File responsibilities

- `app.py` — CLI commands and interactive menu.
- `appointment_service.py` — booking, cancellation, slot rules, and business logic.
- `models.py` — `Slot` and `Appointment` data models.
- `validators.py` — name, email, reason, and ID validation.
- `repository.py` — atomic JSON persistence.
- `test_app.py` — automated unit tests.
- `data/appointments.json` — local persistence file.

## Healthcare safety boundary

This is a local development MVP, not a clinical records system. Do not enter real patient data. Production use would require authentication, role-based access control, encryption, audit logging, secure backups, privacy controls, retention policies, notifications, and applicable healthcare compliance review.
