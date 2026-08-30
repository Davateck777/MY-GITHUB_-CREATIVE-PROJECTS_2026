# Disease Predictor WebApp MVP

A local browser interface for the attached diabetes and heart-disease models. The WebApp keeps the trained Scikit-learn pipelines and exposes them through a small Python HTTP API.

> **Safety boundary:** This is an educational/research prototype. It is not a medical device or diagnostic system. Do not enter real patient data or use the output for clinical decisions.

## File structure

```text
disease_predictor_webapp/
├── app.py                         # HTTP server, API routes, static-file serving
├── model_service.py               # Model loading, validation, prediction
├── README.md
├── requirements.txt
├── .gitignore
├── models/
│   ├── diabetes_model.joblib      # Trained diabetes pipeline
│   └── heart_model.joblib          # Trained heart-disease pipeline
├── data/
│   └── raw/
│       ├── diabetes_prediction_dataset.csv
│       └── heart.csv
└── static/
    ├── index.html                 # WebApp layout and safety copy
    ├── styles.css                 # Responsive visual system
    └── app.js                     # API client and dynamic form
```

## Setup

```bash
cd disease_predictor_webapp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Open:

```text
http://localhost:8000
```

Use another port if needed:

```bash
PORT=8080 python3 app.py
```

## API

```text
GET  /api/health
GET  /api/datasets
GET  /api/model-info?dataset=diabetes
POST /api/predict
```

Example request:

```json
{
  "dataset": "diabetes",
  "features": {
    "gender": "Female",
    "age": 54,
    "hypertension": 0,
    "heart_disease": 0,
    "smoking_history": "never",
    "bmi": 27.32,
    "HbA1c_level": 6.1,
    "blood_glucose_level": 140
  }
}
```

The API returns an estimated positive-class probability, predicted class, display-only risk band, model type, training timestamp, and disclaimer.

## Comment policy

Each HTML, CSS, JavaScript, and Python code section includes a self-explanatory comment block describing its responsibility. This is intentional so the MVP can be reviewed by both software and healthcare-domain stakeholders.

## Production requirements

Before any serious use, add authentication, authorization, secure secrets management, encryption, audit logging, model/version governance, dataset provenance, calibration, external validation, fairness analysis, monitoring, privacy controls, and legal/regulatory review.
