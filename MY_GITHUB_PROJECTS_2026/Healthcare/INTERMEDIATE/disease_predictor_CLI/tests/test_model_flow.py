from pathlib import Path

import joblib

from src.config import DEFAULT_DATA_FILES, get_dataset_spec
from src.data_loader import prepare_dataset
from src.predict import predict_record, risk_band
from src.preprocessing import build_pipeline
from src.train import train_dataset


def test_pipeline_trains_on_heart_dataset():
    spec = get_dataset_spec("heart")
    prepared = prepare_dataset(Path(DEFAULT_DATA_FILES["heart"]), spec)
    pipeline = build_pipeline(spec)
    pipeline.fit(prepared.features, prepared.target)
    predictions = pipeline.predict(prepared.features.head(3))
    assert len(predictions) == 3
    assert set(predictions).issubset({0, 1})


def test_training_persists_model_and_metrics(tmp_path):
    model_path = tmp_path / "heart.joblib"
    report_path = tmp_path / "heart-metrics.json"
    report = train_dataset(
        "heart",
        model_path=model_path,
        report_path=report_path,
        random_state=7,
    )
    assert model_path.exists()
    assert report_path.exists()
    assert "roc_auc" in report["test_metrics"]
    assert 0 <= report["test_metrics"]["roc_auc"] <= 1

    bundle = joblib.load(model_path)
    assert bundle["metadata"]["dataset"] == "heart"


def test_saved_model_returns_probability_in_range(tmp_path):
    model_path = tmp_path / "diabetes.joblib"
    train_dataset("diabetes", model_path=model_path, report_path=tmp_path / "metrics.json")
    record = {
        "gender": "Female",
        "age": 54,
        "hypertension": 0,
        "heart_disease": 0,
        "smoking_history": "never",
        "bmi": 27.32,
        "HbA1c_level": 6.1,
        "blood_glucose_level": 140,
    }
    result = predict_record(model_path, record)
    assert 0 <= result["positive_class_probability"] <= 1
    assert result["predicted_class"] in (0, 1)
    assert result["risk_band"] in {"Low display band", "Moderate display band", "Elevated display band"}


def test_risk_band_is_deterministic():
    assert risk_band(0.1) == "Low display band"
    assert risk_band(0.5) == "Moderate display band"
    assert risk_band(0.9) == "Elevated display band"
