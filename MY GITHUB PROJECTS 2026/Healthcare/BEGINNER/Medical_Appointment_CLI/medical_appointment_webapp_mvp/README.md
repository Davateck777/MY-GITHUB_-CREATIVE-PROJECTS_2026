# Medical Appointment WebApp MVP

This project packages the Medical Appointment CLI MVP into a browser-based WebApp.

## File structure

```text
medical_appointment_webapp_mvp/
├── server.py
├── appointment_service.py
├── models.py
├── validators.py
├── repository.py
├── README.md
├── requirements.txt
├── data/
│   └── appointments.json
└── static/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Included use cases

- Browse available slots
- Book an appointment
- View appointments by patient email
- Cancel a booked appointment
- Persist appointments between server restarts

## Run the WebApp

```bash
cd medical_appointment_webapp_mvp
python3 server.py
```

Open:

```text
http://localhost:8000
```

The server binds to `0.0.0.0` by default for local and sandbox previews. Override the port if needed:

```bash
PORT=4200 python server.py
```

Use a separate data file while testing:

```bash
APPOINTMENT_STORE=/tmp/medical-appointments.json python3 server.py
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/slots` | List available slots; optional `date` and `specialty` filters |
| GET | `/api/appointments?email=...` | List all or patient-specific appointments |
| POST | `/api/appointments` | Book an appointment |
| POST | `/api/appointments/{id}/cancel` | Cancel an appointment |

## Example booking body

```json
{
  "slotId": "SLOT-001",
  "patientName": "Demo Patient",
  "patientEmail": "demo@example.com",
  "reason": "Routine consultation"
}
```

## Technical notes

- Python standard library only; no third-party packages.
- The core service and repository are separated from the HTTP server.
- The frontend is vanilla HTML, CSS, and JavaScript.
- The JSON repository uses atomic replacement writes.
- The first server start seeds future weekday appointment slots.

## Healthcare safety boundary

This is a development/demo MVP. Do not enter real patient information. A production healthcare system requires authentication, authorization, encryption, audit logging, access controls, secure backups, privacy controls, retention policies, and applicable healthcare compliance review.
