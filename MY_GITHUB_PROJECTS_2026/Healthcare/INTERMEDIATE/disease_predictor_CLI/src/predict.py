"""Make a single prediction from a saved model bundle."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from .validation import InputValidationError, validate_prediction_record
from .schemas import DatasetSpec


DISCLAIMER = (
    "Educational screening output only; this is not a medical diagnosis or treatment recommendation. "
    "A qualified healthcare professional must interpret clinical information."
)


def spec_from_metadata(metadata: dict[str, Any]) -> DatasetSpec:
    return DatasetSpec(
        name=metadata["dataset"],
        label=metadata["label"],
        target_column=metadata["target_column"],
        numeric_features=tuple(metadata["numeric_features"]),
        categorical_features=tuple(metadata["categorical_features"]),
        positive_label=int(metadata.get("positive_label", 1)),
    )


def risk_band(probability: float) -> str:
    # These are display bands for this demo, not clinically validated cutoffs.
    if probability < 0.33:
        return "Low display band"
    if probability < 0.66:
        return "Moderate display band"
    return "Elevated display band"


def predict_record(model_path: Path, record: dict[str, Any]) -> dict[str, Any]:
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    bundle = joblib.load(model_path)
    if not isinstance(bundle, dict) or "pipeline" not in bundle or "metadata" not in bundle:
        raise ValueError("Model file is not a valid disease-predictor bundle.")

    metadata = bundle["metadata"]
    spec = spec_from_metadata(metadata)
    cleaned_record = validate_prediction_record(record, spec)
    frame = pd.DataFrame([cleaned_record], columns=list(spec.feature_columns))
    pipeline = bundle["pipeline"]
    probability = float(pipeline.predict_proba(frame)[0, 1])
    prediction = int(pipeline.predict(frame)[0])

    return {
        "dataset": metadata["dataset"],
        "label": metadata["label"],
        "positive_class_probability": probability,
        "positive_class_percentage": round(probability * 100, 2),
        "predicted_class": prediction,
        "risk_band": risk_band(probability),
        "model_type": metadata.get("model_type", "unknown"),
        "model_trained_at": metadata.get("trained_at"),
        "disclaimer": DISCLAIMER,
    }


def format_prediction(result: dict[str, Any]) -> str:
    return "\n".join(
        [
            f"Dataset:             {result['label']}",
            f"Estimated probability: {result['positive_class_percentage']:.2f}%",
            f"Display band:        {result['risk_band']}",
            f"Predicted class:     {result['predicted_class']}",
            f"Model:               {result['model_type']}",
            "",
            f"WARNING: {result['disclaimer']}",
        ]
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Predict from a saved disease model.")
    parser.add_argument("--model", type=Path, required=True, help="Saved .joblib model bundle.")
    parser.add_argument("--input", type=Path, required=True, help="JSON file containing feature values.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        record = json.loads(args.input.read_text(encoding="utf-8"))
        result = predict_record(args.model, record)
    except (OSError, json.JSONDecodeError, ValueError, InputValidationError) as exc:
        print(f"Prediction failed: {exc}")
        return 1
    print(format_prediction(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
