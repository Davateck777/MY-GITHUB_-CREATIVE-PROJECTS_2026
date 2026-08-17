"""Input validation and normalization for the appointment CLI."""

from __future__ import annotations

import re


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class ValidationError(ValueError):
    """Raised when user input does not meet MVP validation rules."""


def normalize_name(value: str) -> str:
    name = " ".join(str(value).strip().split())
    if len(name) < 2:
        raise ValidationError("Patient name must contain at least 2 characters.")
    if len(name) > 100:
        raise ValidationError("Patient name must be 100 characters or fewer.")
    return name


def normalize_email(value: str) -> str:
    email = str(value).strip().lower()
    if not EMAIL_PATTERN.fullmatch(email):
        raise ValidationError("Enter a valid email address.")
    return email


def normalize_reason(value: str) -> str:
    reason = " ".join(str(value or "").strip().split())
    if len(reason) > 250:
        raise ValidationError("Reason must be 250 characters or fewer.")
    return reason


def require_id(value: str, label: str) -> str:
    identifier = str(value).strip()
    if not identifier:
        raise ValidationError(f"{label} is required.")
    return identifier
