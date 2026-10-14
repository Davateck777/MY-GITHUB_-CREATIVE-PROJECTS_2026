# Disease Predictor MVP

A research/education-oriented binary classification MVP using the supplied Kaggle-style datasets and Scikit-learn.

> **Important:** This project is not a medical device, diagnostic system, or treatment recommendation tool. Do not use it with real patient data or for clinical decisions without a complete clinical validation, security, privacy, regulatory, and bias review.

## Included datasets

The attached datasets have been copied into `data/raw/`:

| Dataset | Rows | Target | Features |
|---|---:|---|---:|
| `diabetes_prediction_dataset.csv` | 100,000 | `diabetes` | 8 |
| `heart.csv` | 1,025 | `target` | 13 |

The loader removes exact duplicate rows before training and records the number removed in the report. The supplied diabetes dataset contains 3,854 duplicate rows; the supplied heart dataset contains 723 duplicate rows. Review this decision for any real research workflow.

## File structure

```text
disease_predictor/
├── app.py
├── README.md
├── requirements.txt
├── .gitignore
├── data/
│   ├── raw/
│   │   ├── diabetes_prediction_dataset.csv
│   │   └── heart.csv
│   ├── processed/
│   │   └── .gitkeep
│   └── examples/
│       ├── diabetes.patient.example.json
│       └── heart.patient.example.json
├── models/
│   └── .gitkeep
├── reports/
│   └── .gitkeep
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── schemas.py
│   ├── data_loader.py
│   ├── validation.py
│   ├── preprocessing.py
│   ├── train.py
│   ├── evaluate.py
│   ├── predict.py
│   └── output.py
└── tests/
    ├── test_data_loader.py
    ├── test_validation.py
    └── test_model_flow.py
```

## Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell:

```powershell
python -m venv .venv 🔁
.venv\Scripts\Activate.ps1 🔁
pip install -r requirements.txt ✔
```

## Inspect a dataset

```bash
python app.py inspect --dataset diabetes
python app.py inspect --dataset heart
```

Inspecting reports shape, features, target distribution, missing values, and duplicate removal.

## Train models

```bash
python app.py train --dataset diabetes
python app.py train --dataset heart
```

Outputs:

```text
models/diabetes_model.joblib
models/heart_model.joblib
reports/diabetes_metrics.json
reports/heart_metrics.json
```

The model is a Scikit-learn `Pipeline` containing:

```text
SimpleImputer → StandardScaler
SimpleImputer → OneHotEncoder
LogisticRegression(class_weight="balanced")
```

The preprocessing and estimator are persisted together to reduce training/prediction mismatch.

## Run a prediction

After training:

```bash
python app.py predict 
  --model models/diabetes_model.joblib 
  --input data/examples/diabetes.patient.example.json
```

```bash
python app.py predict 
  --model models/heart_model.joblib
  --input data/examples/heart.patient.example.json
```

app.py predict [-h] --model MODEL --input INPUT

The output is an estimated positive-class probability, a display-only risk band, and a safety disclaimer. The display bands are not clinically validated thresholds.

## Run tests

```bash
pytest -q
```

## Design decisions

- Diabetes and heart-disease data are trained as separate tasks because their features and targets have different meanings.
- Exact duplicates are removed before splitting to reduce leakage from repeated records.
- The baseline uses logistic regression for a relatively interpretable starting point.
- Class balancing is enabled because disease labels can be imbalanced.
- Metrics include accuracy, precision, sensitivity/recall, specificity, F1, ROC-AUC, average precision, and the confusion matrix.
- Unknown categorical values at prediction time are tolerated by the encoder; missing required fields are rejected.

## Next steps before any serious use

- Establish dataset provenance and license documentation.
- Define a clinically meaningful target and intended-use population.
- Add external validation and temporal/geographic validation.
- Calibrate probabilities and validate thresholds with domain experts.
- Add fairness analysis across relevant demographic groups.
- Add authentication, authorization, encryption, audit logging, monitoring, and secure model registry controls.
- Obtain appropriate clinical, legal, privacy, and regulatory review.
