#!/usr/bin/env python3
"""Disease Predictor MVP command-line application."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from src.config import DEFAULT_DATA_FILES, DEFAULT_MODEL_FILES, DEFAULT_REPORT_FILES, get_dataset_spec
from src.data_loader import DatasetError, load_csv, prepare_dataset
from src.predict import format_prediction, predict_record
from src.train import train_dataset
from src.validation import dataset_summary


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Train and run an educational diabetes or heart-disease predictor."
    )
    commands = parser.add_subparsers(dest="command")

    inspect = commands.add_parser("inspect", help="Inspect a dataset before training.")
    inspect.add_argument("--dataset", choices=["diabetes", "heart"], required=True)
    inspect.add_argument("--data", type=Path, help="Dataset CSV path.")

    train = commands.add_parser("train", help="Train and evaluate a model.")
    train.add_argument("--dataset", choices=["diabetes", "heart"], required=True)
    train.add_argument("--data", type=Path, help="Dataset CSV path.")
    train.add_argument("--model-output", type=Path, help="Saved model path.")
    train.add_argument("--report-output", type=Path, help="Metrics report path.")
    train.add_argument("--test-size", type=float, default=0.2)
    train.add_argument("--random-state", type=int, default=42)

    predict = commands.add_parser("predict", help="Predict from a saved model bundle.")
    predict.add_argument("--model", type=Path, required=True)
    predict.add_argument("--input", type=Path, required=True, help="JSON feature record.")
    return parser


def inspect_dataset(dataset_name: str, data_path: Path | None) -> dict:
    spec = get_dataset_spec(dataset_name)
    path = data_path or DEFAULT_DATA_FILES[spec.name]
    prepared = prepare_dataset(path, spec)
    summary = dataset_summary(prepared.frame, spec, prepared.duplicate_rows_removed)
    summary["rows_before_deduplication"] = prepared.rows_before_deduplication
    return summary


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help()
        return 0

    try:
        if args.command == "inspect":
            print(json.dumps(inspect_dataset(args.dataset, args.data), indent=2))
        elif args.command == "train":
            report = train_dataset(
                args.dataset,
                data_path=args.data,
                model_path=args.model_output,
                report_path=args.report_output,
                test_size=args.test_size,
                random_state=args.random_state,
            )
            print(json.dumps(report, indent=2))
        elif args.command == "predict":
            result = predict_record(
                args.model,
                json.loads(args.input.read_text(encoding="utf-8")),
            )
            print(format_prediction(result))
    except (DatasetError, FileNotFoundError, json.JSONDecodeError, ValueError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
