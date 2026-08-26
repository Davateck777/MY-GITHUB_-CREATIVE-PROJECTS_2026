from pathlib import Path

from src.config import DEFAULT_DATA_FILES, get_dataset_spec
from src.data_loader import prepare_dataset


def test_diabetes_dataset_is_loaded_and_duplicates_are_reported():
    spec = get_dataset_spec("diabetes")
    prepared = prepare_dataset(Path(DEFAULT_DATA_FILES["diabetes"]), spec)

    assert prepared.rows_before_deduplication == 100000
    assert len(prepared.frame) < prepared.rows_before_deduplication
    assert prepared.duplicate_rows_removed > 0
    assert tuple(prepared.features.columns) == spec.feature_columns
    assert set(prepared.target.unique()) == {0, 1}


def test_heart_dataset_schema_is_loaded():
    spec = get_dataset_spec("heart")
    prepared = prepare_dataset(Path(DEFAULT_DATA_FILES["heart"]), spec)

    assert prepared.rows_before_deduplication == 1025
    assert prepared.target.name == "target"
    assert prepared.features.shape[1] == 13
