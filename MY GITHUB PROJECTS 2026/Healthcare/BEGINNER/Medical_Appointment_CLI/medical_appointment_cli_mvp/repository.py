"""JSON persistence for the medical appointment CLI MVP."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path


class RepositoryError(Exception):
    """Raised when appointment data cannot be read or written."""


class JsonRepository:
    def __init__(self, path: Path):
        self.path = Path(path)

    def load(self) -> dict:
        if not self.path.exists():
            return {"slots": [], "appointments": []}

        try:
            with self.path.open("r", encoding="utf-8") as file:
                data = json.load(file)
        except json.JSONDecodeError as exc:
            raise RepositoryError(f"Store file is not valid JSON: {self.path}") from exc
        except OSError as exc:
            raise RepositoryError(f"Could not read store file: {self.path}") from exc

        if not isinstance(data, dict):
            raise RepositoryError("Store file must contain a JSON object.")
        if not isinstance(data.get("slots", []), list):
            raise RepositoryError("Store field 'slots' must be a list.")
        if not isinstance(data.get("appointments", []), list):
            raise RepositoryError("Store field 'appointments' must be a list.")

        return {
            "slots": data.get("slots", []),
            "appointments": data.get("appointments", []),
        }

    def save(self, data: dict) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path: str | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=self.path.parent,
                prefix=f".{self.path.name}.",
                suffix=".tmp",
                delete=False,
            ) as file:
                json.dump(data, file, indent=2)
                file.write("\n")
                temporary_path = file.name
            os.replace(temporary_path, self.path)
        except OSError as exc:
            raise RepositoryError(f"Could not save store file: {self.path}") from exc
        finally:
            if temporary_path and os.path.exists(temporary_path):
                os.unlink(temporary_path)
