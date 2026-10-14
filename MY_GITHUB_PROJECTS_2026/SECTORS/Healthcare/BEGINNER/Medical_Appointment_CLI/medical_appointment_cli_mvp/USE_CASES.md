# Medical Appointment CLI — Five Use Cases

## UC-01: Browse available appointment slots

**Actor:** Patient or clinic staff  
**Goal:** Find a future slot by date or specialty.

1. The user runs `python app.py slots`.
2. The system lists unbooked future slots.
3. The user may filter by `--date` or `--specialty`.
4. The system returns an empty-state message when no slot matches.

## UC-02: Book an appointment

**Actor:** Patient or clinic staff  
**Goal:** Reserve a slot for a patient.

1. The user selects a slot ID.
2. The user supplies patient name, email, and an optional reason.
3. The system validates the input.
4. The system rejects unavailable or past slots.
5. The system creates a confirmation ID and persists the appointment.

## UC-03: View appointments

**Actor:** Patient or clinic staff  
**Goal:** Review scheduled and cancelled appointments.

1. The user runs `python app.py appointments`.
2. The system displays appointment ID, date/time, provider, specialty, and status.
3. The user may filter by patient email.

## UC-04: Cancel an appointment

**Actor:** Patient or clinic staff  
**Goal:** Release a booked slot.

1. The user supplies the appointment confirmation ID.
2. The system verifies the appointment exists and is not already cancelled.
3. The system changes its status to `cancelled`.
4. The original slot becomes available again.

## UC-05: Reschedule an appointment

**Actor:** Patient or clinic staff  
**Goal:** Move an existing booking to another slot.

1. The user supplies the appointment confirmation ID.
2. The system displays or accepts a new available slot ID.
3. The system rejects cancelled, past, missing, or already-booked target slots.
4. The system updates the appointment's provider, specialty, date, and time.
5. The original slot becomes available.

## Production note

These use cases are implemented as a local JSON-backed demo. A production healthcare implementation must add identity verification, role-based access control, consent and privacy controls, encryption, audit trails, conflict-safe transactions, notifications, and compliance review before handling real patient data.
