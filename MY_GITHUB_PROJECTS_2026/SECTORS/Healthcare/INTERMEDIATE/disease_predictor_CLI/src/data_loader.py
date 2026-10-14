"""Dataset loading and preparation."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from .schemas import DatasetSpec


class DatasetError(ValueError):
    """Raised when a dataset cannot be used for training or prediction."""


@dataclass
class PreparedDataset:
    frame: pd.DataFrame
    features: pd.DataFrame
    target: pd.Series
    rows_before_deduplication: int
    duplicate_rows_removed: int


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise DatasetError(f"Dataset file not found: {path}")
    try:
        frame = pd.read_csv(path)
    except Exception as exc:  # pandas raises several parser-specific exceptions.
        raise DatasetError(f"Could not read CSV dataset: {path}") from exc
    if frame.empty:
        raise DatasetError("Dataset is empty.")
    return frame


def prepare_dataset(path: Path, spec: DatasetSpec) -> PreparedDataset:
    frame = load_csv(path)
    missing_columns = [column for column in (spec.target_column, *spec.feature_columns) if column not in frame.columns]
    if missing_columns:
        raise DatasetError(
            f"Dataset is missing required column(s): {', '.join(missing_columns)}"
        )

    rows_before = len(frame)
    frame = frame.drop_duplicates().reset_index(drop=True)
    removed = rows_before - len(frame)
    features = frame.loc[:, list(spec.feature_columns)].copy()
    target = pd.to_numeric(frame[spec.target_column], errors="coerce")

    if target.isna().any():
        raise DatasetError(f"Target column '{spec.target_column}' contains non-numeric or missing values.")
    unique_targets = set(target.astype(int).unique())
    if unique_targets != {0, 1}:
        raise DatasetError(
            f"Target column '{spec.target_column}' must contain both 0 and 1 labels; found {sorted(unique_targets)}."
        )
    if len(features) < 20:
        raise DatasetError("Dataset must contain at least 20 usable rows.")

    return PreparedDataset(
        frame=frame,
        features=features,
        target=target.astype(int),
        rows_before_deduplication=rows_before,
        duplicate_rows_removed=removed,
    )
