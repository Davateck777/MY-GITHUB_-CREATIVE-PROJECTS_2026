"""Dataset summaries and prediction-input validation."""

from __future__ import annotations

import math
from typing import Any

import pandas as pd

from .schemas import DatasetSpec


class InputValidationError(ValueError):
    """Raised when a prediction payload is invalid."""


def dataset_summary(frame: pd.DataFrame, spec: DatasetSpec, duplicates_removed: int = 0) -> dict[str, Any]:
    target_counts = frame[spec.target_column].value_counts(dropna=False).sort_index()
    return {
        "dataset": spec.name,
        "label": spec.label,
        "rows": int(len(frame)),
        "columns": int(len(frame.columns)),
        "feature_columns": list(spec.feature_columns),
        "target_column": spec.target_column,
        "missing_values": int(frame.isna().sum().sum()),
        "duplicate_rows_removed": int(duplicates_removed),
        "target_distribution": {str(key): int(value) for key, value in target_counts.items()},
    }


def validate_prediction_record(record: dict[str, Any], spec: DatasetSpec) -> dict[str, Any]:
    if not isinstance(record, dict):
        raise InputValidationError("Prediction input must be a JSON object.")

    missing = [column for column in spec.feature_columns if column not in record]
    if missing:
        raise InputValidationError(f"Missing feature(s): {', '.join(missing)}")

    cleaned: dict[str, Any] = {}
    for column in spec.numeric_features:
        value = record[column]
        try:
            numeric_value = float(value)
        except (TypeError, ValueError) as exc:
            raise InputValidationError(f"Feature '{column}' must be numeric.") from exc
        if not math.isfinite(numeric_value):
            raise InputValidationError(f"Feature '{column}' must be finite.")
        cleaned[column] = numeric_value

    for column in spec.categorical_features:
        value = record[column]
        if value is None or str(value).strip() == "":
            raise InputValidationError(f"Feature '{column}' cannot be empty.")
        cleaned[column] = str(value).strip()

    return cleaned
