import pytest

from src.config import get_dataset_spec
from src.validation import InputValidationError, validate_prediction_record


def test_prediction_record_is_normalized():
    spec = get_dataset_spec("diabetes")
    record = {
        "gender": " Female ",
        "age": "54",
        "hypertension": 0,
        "heart_disease": 0,
        "smoking_history": "never",
        "bmi": "27.32",
        "HbA1c_level": 6.1,
        "blood_glucose_level": 140,
    }
    cleaned = validate_prediction_record(record, spec)
    assert cleaned["gender"] == "Female"
    assert cleaned["age"] == 54.0
    assert cleaned["bmi"] == 27.32


def test_missing_feature_is_rejected():
    spec = get_dataset_spec("heart")
    with pytest.raises(InputValidationError, match="Missing feature"):
        validate_prediction_record({"age": 52}, spec)


def test_non_finite_numeric_value_is_rejected():
    spec = get_dataset_spec("diabetes")
    record = {
        "gender": "Female",
        "age": "nan",
        "hypertension": 0,
        "heart_disease": 0,
        "smoking_history": "never",
        "bmi": 27.32,
        "HbA1c_level": 6.1,
        "blood_glucose_level": 140,
    }
    with pytest.raises(InputValidationError, match="finite"):
        validate_prediction_record(record, spec)
