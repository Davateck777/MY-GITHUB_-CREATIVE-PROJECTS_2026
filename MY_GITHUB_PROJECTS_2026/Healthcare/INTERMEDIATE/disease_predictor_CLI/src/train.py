"""Train and persist disease-prediction models."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
from sklearn.model_selection import train_test_split

from .config import DEFAULT_DATA_FILES, DEFAULT_MODEL_FILES, DEFAULT_REPORT_FILES, get_dataset_spec
from .data_loader import DatasetError, prepare_dataset
from .evaluate import evaluate_pipeline
from .preprocessing import build_pipeline
from .validation import dataset_summary


DEFAULT_RANDOM_STATE = 42
DEFAULT_TEST_SIZE = 0.2


def train_dataset(
    dataset_name: str,
    data_path: Path | None = None,
    model_path: Path | None = None,
    report_path: Path | None = None,
    random_state: int = DEFAULT_RANDOM_STATE,
    test_size: float = DEFAULT_TEST_SIZE,
) -> dict[str, Any]:
    spec = get_dataset_spec(dataset_name)
    data_path = data_path or DEFAULT_DATA_FILES[spec.name]
    model_path = model_path or DEFAULT_MODEL_FILES[spec.name]
    report_path = report_path or DEFAULT_REPORT_FILES[spec.name]

    if not 0.1 <= test_size <= 0.5:
        raise ValueError("test_size must be between 0.1 and 0.5.")

    prepared = prepare_dataset(data_path, spec)
    x_train, x_test, y_train, y_test = train_test_split(
        prepared.features,
        prepared.target,
        test_size=test_size,
        random_state=random_state,
        stratify=prepared.target,
    )

    pipeline = build_pipeline(spec, random_state=random_state)
    pipeline.fit(x_train, y_train)
    metrics = evaluate_pipeline(pipeline, x_test, y_test)

    metadata = {
        "dataset": spec.name,
        "label": spec.label,
        "target_column": spec.target_column,
        "feature_columns": list(spec.feature_columns),
        "numeric_features": list(spec.numeric_features),
        "categorical_features": list(spec.categorical_features),
        "positive_label": spec.positive_label,
        "model_type": "LogisticRegression",
        "threshold": 0.5,
        "random_state": random_state,
        "test_size": test_size,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "source_file": str(data_path),
        "rows_used": len(prepared.frame),
        "duplicate_rows_removed": prepared.duplicate_rows_removed,
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "metadata": metadata}, model_path)

    report = {
        "metadata": metadata,
        "dataset_summary": dataset_summary(
            prepared.frame,
            spec,
            duplicates_removed=prepared.duplicate_rows_removed,
        ),
        "train_rows": len(x_train),
        "test_rows": len(x_test),
        "test_metrics": metrics,
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train a disease-prediction model.")
    parser.add_argument("--dataset", choices=["diabetes", "heart"], required=True)
    parser.add_argument("--data", type=Path, help="Path to the dataset CSV.")
    parser.add_argument("--model-output", type=Path, help="Where to save the joblib model.")
    parser.add_argument("--report-output", type=Path, help="Where to save evaluation JSON.")
    parser.add_argument("--test-size", type=float, default=DEFAULT_TEST_SIZE)
    parser.add_argument("--random-state", type=int, default=DEFAULT_RANDOM_STATE)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        report = train_dataset(
            args.dataset,
            data_path=args.data,
            model_path=args.model_output,
            report_path=args.report_output,
            random_state=args.random_state,
            test_size=args.test_size,
        )
    except (DatasetError, ValueError, OSError) as exc:
        print(f"Training failed: {exc}")
        return 1

    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
