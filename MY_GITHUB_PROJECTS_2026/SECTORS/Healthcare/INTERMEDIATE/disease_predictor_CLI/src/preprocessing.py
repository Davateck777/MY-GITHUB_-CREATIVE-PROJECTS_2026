"""Scikit-learn preprocessing and baseline estimator."""

from __future__ import annotations

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .schemas import DatasetSpec



def build_pipeline(spec: DatasetSpec, random_state: int = 42) -> Pipeline:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    transformer = ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, list(spec.numeric_features)),
            ("categorical", categorical_pipeline, list(spec.categorical_features)),
        ],
        remainder="drop",
    )

    estimator = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=random_state,
        solver="lbfgs",
    )
    return Pipeline(
        steps=[
            ("preprocessor", transformer),
            ("classifier", estimator),
        ]
    )
