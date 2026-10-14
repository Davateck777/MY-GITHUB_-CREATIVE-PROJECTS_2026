"""Configuration schemas for the disease-prediction MVP."""

from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class DatasetSpec:
    name: str
    label: str
    target_column: str
    numeric_features: tuple[str, ...]
    categorical_features: tuple[str, ...]
    positive_label: int = 1

    @property
    def feature_columns(self) -> tuple[str, ...]:
        return self.numeric_features + self.categorical_features

    def to_dict(self) -> dict:
        return asdict(self)
