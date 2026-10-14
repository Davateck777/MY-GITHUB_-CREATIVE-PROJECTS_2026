"""Model loading and prediction logic for the Disease Predictor WebApp."""

from __future__ import annotations

# -----------------------------------------------------------------------------
# Standard-library imports keep the webapp service small and easy to deploy.
# -----------------------------------------------------------------------------
import math
from pathlib import Path
from typing import Any

# -----------------------------------------------------------------------------
# Third-party imports are used only for loading the trained pipeline and
# creating the one-row DataFrame expected by the Scikit-learn model.
# -----------------------------------------------------------------------------
import joblib
import pandas as pd

# -----------------------------------------------------------------------------
# Application paths and display metadata. The model bundles were trained from
# the attached datasets and contain their own feature metadata.
# -----------------------------------------------------------------------------
APP_DIR = Path(__file__).resolve().parent
MODEL_DIR = APP_DIR / "models"
MODEL_PATHS = {
    "diabetes": MODEL_DIR / "diabetes_model.joblib",
    "heart": MODEL_DIR / "heart_model.joblib",
}

FEATURE_LABELS = {
    "age": "Age",
    "gender": "Gender",
    "hypertension": "Hypertension",
    "heart_disease": "Heart disease history",
    "smoking_history": "Smoking history",
    "bmi": "BMI",
    "HbA1c_level": "HbA1c level",
    "blood_glucose_level": "Blood glucose level",
    "sex": "Sex code",
    "cp": "Chest pain type code",
    "trestbps": "Resting blood pressure",
    "chol": "Cholesterol",
    "fbs": "Fasting blood sugar code",
    "restecg": "Resting ECG code",
    "thalach": "Maximum heart rate",
    "exang": "Exercise-induced angina code",
    "oldpeak": "ST depression",
    "slope": "Slope code",
    "ca": "Major vessels code",
    "thal": "Thalassemia code",
}

CATEGORICAL_OPTIONS = {
    "gender": ["Female", "Male", "Other"],
    "smoking_history": ["No Info", "current", "ever", "former", "never", "not current"],
    "sex": ["0", "1"],
    "cp": ["0", "1", "2", "3"],
    "fbs": ["0", "1"],
    "restecg": ["0", "1", "2"],
    "exang": ["0", "1"],
    "slope": ["0", "1", "2"],
    "ca": ["0", "1", "2", "3", "4"],
    "thal": ["0", "1", "2", "3"],
}

# -----------------------------------------------------------------------------
# The cache avoids loading the same model from disk for every prediction.
# -----------------------------------------------------------------------------
_MODEL_CACHE: dict[str, dict[str, Any]] = {}


# -----------------------------------------------------------------------------
# Model access helpers expose dataset choices and input fields to the browser.
# -----------------------------------------------------------------------------
def load_bundle(dataset: str) -> dict[str, Any]:
    dataset = dataset.lower()
    if dataset not in MODEL_PATHS:
        raise ValueError("Dataset must be 'diabetes' or 'heart'.")
    if dataset not in _MODEL_CACHE:
        model_path = MODEL_PATHS[dataset]
        if not model_path.exists():
            raise FileNotFoundError(f"Trained model not found: {model_path}")
        bundle = joblib.load(model_path)
        if not isinstance(bundle, dict) or "pipeline" not in bundle or "metadata" not in bundle:
            raise ValueError(f"Invalid model bundle: {model_path}")
        _MODEL_CACHE[dataset] = bundle
    return _MODEL_CACHE[dataset]


def feature_descriptor(name: str, metadata: dict[str, Any]) -> dict[str, Any]:
    is_categorical = name in metadata.get("categorical_features", [])
    descriptor = {
        "name": name,
        "label": FEATURE_LABELS.get(name, name.replace("_", " ").title()),
        "type": "select" if is_categorical else "number",
        "required": True,
    }
    if is_categorical:
        descriptor["options"] = CATEGORICAL_OPTIONS.get(name, [])
    return descriptor


def get_catalog() -> list[dict[str, Any]]:
    catalog = []
    for dataset, model_path in MODEL_PATHS.items():
        bundle = load_bundle(dataset)
        metadata = bundle["metadata"]
        catalog.append(
            {
                "id": dataset,
                "label": metadata["label"],
                "modelType": metadata.get("model_type", "unknown"),
                "targetColumn": metadata["target_column"],
                "rowsUsed": metadata.get("rows_used"),
                "trainedAt": metadata.get("trained_at"),
                "modelFile": model_path.name,
                "features": [
                    feature_descriptor(name, metadata)
                    for name in metadata["feature_columns"]
                ],
            }
        )
    return catalog


# -----------------------------------------------------------------------------
# Input validation converts browser form values into the exact feature order
# used during training. It rejects missing, malformed, and non-finite values.
# -----------------------------------------------------------------------------
def validate_features(features: Any, metadata: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(features, dict):
        raise ValueError("Features must be supplied as a JSON object.")

    required_features = metadata["feature_columns"]
    missing = [name for name in required_features if name not in features]
    if missing:
        raise ValueError(f"Missing feature(s): {', '.join(missing)}")

    numeric_features = set(metadata.get("numeric_features", []))
    cleaned: dict[str, Any] = {}
    for name in required_features:
        value = features[name]
        if name in numeric_features:
            try:
                number = float(value)
            except (TypeError, ValueError) as exc:
                raise ValueError(f"{FEATURE_LABELS.get(name, name)} must be numeric.") from exc
            if not math.isfinite(number):
                raise ValueError(f"{FEATURE_LABELS.get(name, name)} must be finite.")
            cleaned[name] = number
        else:
            if value is None or str(value).strip() == "":
                raise ValueError(f"{FEATURE_LABELS.get(name, name)} is required.")
            cleaned[name] = str(value).strip()
    return cleaned


# -----------------------------------------------------------------------------
# The prediction service runs the saved preprocessing + classifier pipeline,
# returning probability, predicted class, model details, and a safety warning.
# -----------------------------------------------------------------------------
def risk_band(probability: float) -> str:
    # Display-only thresholds; they are not clinically validated cutoffs.
    if probability < 0.33:
        return "Low display band"
    if probability < 0.66:
        return "Moderate display band"
    return "Elevated display band"


def predict(dataset: str, features: dict[str, Any]) -> dict[str, Any]:
    bundle = load_bundle(dataset)
    metadata = bundle["metadata"]
    cleaned = validate_features(features, metadata)
    frame = pd.DataFrame([cleaned], columns=metadata["feature_columns"])
    pipeline = bundle["pipeline"]
    probability = float(pipeline.predict_proba(frame)[0, 1])
    predicted_class = int(pipeline.predict(frame)[0])
    return {
        "dataset": metadata["dataset"],
        "label": metadata["label"],
        "modelType": metadata.get("model_type", "unknown"),
        "probability": probability,
        "percentage": round(probability * 100, 2),
        "predictedClass": predicted_class,
        "riskBand": risk_band(probability),
        "trainedAt": metadata.get("trained_at"),
        "disclaimer": (
            "Educational screening output only — not a medical diagnosis or "
            "treatment recommendation. A qualified healthcare professional "
            "must interpret clinical information."
        ),
    }
