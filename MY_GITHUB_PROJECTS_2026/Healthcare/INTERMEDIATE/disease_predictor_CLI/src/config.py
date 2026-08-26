"""Dataset and artifact configuration."""

from __future__ import annotations

from pathlib import Path

from .schemas import DatasetSpec

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
MODEL_DIR = PROJECT_ROOT / "models"
REPORT_DIR = PROJECT_ROOT / "reports"

DATASET_SPECS = {
    "diabetes": DatasetSpec(
        name="diabetes",
        label="Diabetes prediction",
        target_column="diabetes",
        numeric_features=(
            "age",
            "hypertension",
            "heart_disease",
            "bmi",
            "HbA1c_level",
            "blood_glucose_level",
        ),
        categorical_features=("gender", "smoking_history"),
    ),
    "heart": DatasetSpec(
        name="heart",
        label="Heart-disease prediction",
        target_column="target",
        numeric_features=("age", "trestbps", "chol", "thalach", "oldpeak"),
        categorical_features=(
            "sex",
            "cp",
            "fbs",
            "restecg",
            "exang",
            "slope",
            "ca",
            "thal",
        ),
    ),
}

DEFAULT_DATA_FILES = {
    "diabetes": RAW_DATA_DIR / "diabetes_prediction_dataset.csv",
    "heart": RAW_DATA_DIR / "heart.csv",
}

DEFAULT_MODEL_FILES = {
    name: MODEL_DIR / f"{name}_model.joblib" for name in DATASET_SPECS
}

DEFAULT_REPORT_FILES = {
    name: REPORT_DIR / f"{name}_metrics.json" for name in DATASET_SPECS
}


def get_dataset_spec(dataset_name: str) -> DatasetSpec:
    try:
        return DATASET_SPECS[dataset_name.lower()]
    except KeyError as exc:
        available = ", ".join(sorted(DATASET_SPECS))
        raise ValueError(f"Unknown dataset '{dataset_name}'. Choose from: {available}.") from exc
