
# Healthcare Disease Predictor — MVP Planning Sheet




> **Notation**
>
> - `[ ... ]` = what will be designed, built, or delivered.
> - `( ... )` = why it is needed or how the decision is justified.

| Field                                               | Definition                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **YOUR_ROLE (FUNC.)**                               | `[ SOFTWARE ENGINEER ]`                                                                                                                                                                                                                                                                                                     |
| **WHAT_SECTOR**                                     | `[ Healthcare ]`                                                                                                                                                                                                                                                                                                            |
| **WHAT_PROBLEM**                                    | `[ Healthcare learners, analysts, and clinical researchers need a reproducible way to estimate disease risk from structured patient indicators such as glucose, blood pressure, BMI, age, cholesterol, and related measurements. ]`                                                                                         |
| **WHY_PROBLEM**                                     | `( Manual review of multiple risk factors can be inconsistent and time-consuming. A machine-learning prototype can help identify patterns and provide an early screening signal, but it must not replace clinical diagnosis or professional judgment. )`                                                                    |
| **ANALYSIS (PROBLEM)**                              | `[ The diabetes and heart-disease datasets represent different prediction problems and should be trained and evaluated separately. The MVP must handle dataset-specific target columns, missing values, feature validation, class imbalance, model evaluation, explainable output, and responsible-use warnings. ]`         |
| **SOLUTION**                                        | `[ Disease Predictor: Use Scikit-learn on the Kaggle Diabetes/Heart Disease dataset. ]`                                                                                                                                                                                                                                     |
| **WHY_SOLUTION**                                    | `( Scikit-learn provides reliable tools for tabular classification, preprocessing pipelines, train/test splitting, model evaluation, probability prediction, and reproducible experimentation. It is appropriate for a transparent educational MVP before considering more complex models. )`                               |
| **HOW_IMPLEMENT_SOLUTION**                          | `[ Build a modular Python machine-learning application with data ingestion, preprocessing, model training, evaluation, saved model artifacts, and a prediction interface. ]`                                                                                                                                                |
| **WHERE_IMPLEMENT_SOLUTION(S)**                     | `[ Local Python development environment first, using a virtual environment and a supplied Kaggle CSV file. The predictor will initially run through the command line, with a service boundary that can later support a web interface or internal API. ]`                                                                    |
| **WHAT_MUST_BE_CONNECTED_TOGETHER TO MAKE IT WORK** | `( The raw dataset, schema validation, preprocessing pipeline, trained model, evaluation metrics, model metadata, prediction input, output formatter, tests, and responsible-use documentation must remain consistent. If one of these is disconnected, the prediction result may be invalid or impossible to reproduce. )` |
| **TARGET_AUDIENCE**                                 | `[ Machine-learning students, public-health analysts, healthcare researchers, software engineers, and clinicians reviewing a non-diagnostic research prototype. ]`                                                                                                                                                          |
| **BRIEFLY_DESCRIBE_SYSTEMS TO BE IMPLEMENTED**      | `[ Dataset ingestion system, schema validation system, preprocessing pipeline, classification model, evaluation and reporting system, model persistence system, prediction service, CLI interface, automated tests, and safety documentation. ]`                                                                            |
| **DEVELOP FINALIZED MVP**                           | `[ Wait for the user's CREATE FILES_EACH command before creating the project files. ]`                                                                                                                                                                                                                                      |

---

# Disease Predictor MVP Scope

## Supported prediction tasks

The MVP will support one dataset at a time:

```text
[ Diabetes prediction ]
[ Heart-disease prediction ]
```

The datasets will not be mixed because they use different:

- Features
- Target columns
- Clinical meanings
- Data distributions
- Evaluation requirements

The model output will be described as:

```text
[ Estimated probability ]
[ Risk band ]
[ Model confidence/context ]
[ Responsible-use warning ]
```

It will not be described as a confirmed diagnosis.

---

# Features to Implement

## Dataset features

The feature layer will support numeric and, where applicable, categorical columns such as:

```text
Age
BMI
Blood pressure
Glucose
Insulin
Cholesterol
Chest pain indicators
Heart rate
Exercise-related indicators
Smoking or lifestyle indicators
```

The exact features will be detected from the selected CSV schema rather than assumed blindly.

## User-facing features

- `[ ]` Load a diabetes or heart-disease CSV dataset.
- `[ ]` Validate the required target column.
- `[ ]` Display dataset shape and feature summary.
- `[ ]` Train a baseline classification model.
- `[ ]` Evaluate the model.
- `[ ]` Save the trained model.
- `[ ]` Load a saved model.
- `[ ]` Accept patient feature values.
- `[ ]` Return a probability estimate.
- `[ ]` Return a low/medium/high risk band.
- `[ ]` Display a non-diagnostic safety disclaimer.
- `[ ]` Handle invalid or missing input safely.
- `[ ]` Run predictions using the exact preprocessing pipeline used during training.

---

# Design Phase

## 1. Data ingestion design

The application will receive a local CSV file:

```text
data/raw/diabetes.csv
data/raw/heart_disease.csv
```

The raw dataset will remain unchanged. Any cleaned or transformed data will be written separately.

---

## 2. Data validation design

Validation will confirm:

- Dataset exists.
- Dataset is valid CSV.
- Required target column exists.
- Feature columns contain valid values.
- Target contains two classes for binary classification.
- Missing values are identified.
- Duplicate rows are reported.
- Unsupported columns are excluded or flagged.
- Data leakage risks are reviewed.

---

## 3. Preprocessing design

Use a Scikit-learn pipeline containing:

```text
[ Missing-value handling ]
[ Numeric feature scaling ]
[ Categorical feature encoding, if required ]
[ Model estimator ]
```

Recommended baseline:

```text
SimpleImputer
StandardScaler
LogisticRegression
```

Optional comparison model:

```text
RandomForestClassifier
```

The preprocessing and model must be saved together as one pipeline so prediction-time transformations remain consistent.

---

## 4. Evaluation design

The evaluation system will calculate:

```text
Accuracy
Precision
Recall
F1 score
ROC-AUC
Confusion matrix
Sensitivity
Specificity
```

Because healthcare screening may prioritize identifying positive cases, recall and sensitivity must not be hidden behind accuracy alone.

The report should also document:

```text
Dataset name
Feature list
Target column
Train/test split
Random seed
Model type
Class distribution
Evaluation metrics
Model version
```

---

## 5. Prediction design

The prediction flow will be:

```text
User input
   ↓
Input validation
   ↓
Saved preprocessing/model pipeline
   ↓
Probability prediction
   ↓
Risk-band mapping
   ↓
Formatted result + disclaimer
```

Example output:

```text
Estimated positive-class probability: 68%

Risk band: Elevated

This is an educational model output, not a diagnosis.
Consult a qualified healthcare professional for clinical interpretation.
```

---

# Implementation Phase — Step-by-Step

## Step 1: Create the Python project

Create the project directory, virtual environment, dependency file, source directory, test directory, model directory, and data directories.

---

## Step 2: Add the dataset

The user will place the licensed Kaggle CSV file in:

```text
data/raw/
```

The raw dataset will not be committed automatically if it contains sensitive or restricted information.

---

## Step 3: Inspect the dataset

Implement a data inspection command that reports:

- Number of rows
- Number of columns
- Column names
- Data types
- Missing values
- Duplicate records
- Target distribution
- Basic numeric statistics

---

## Step 4: Validate the schema

Create a configurable dataset schema for:

```text
Diabetes
Heart disease
```

The schema should define:

```text
Dataset name
Target column
Expected feature columns
Optional feature columns
Categorical columns
Numeric columns
Positive-class meaning
```

---

## Step 5: Split the data

Use:

```text
Train/test split
Stratification by target
Fixed random seed
```

The test set must remain isolated until final evaluation.

---

## Step 6: Build the Scikit-learn pipeline

Implement:

```text
Input validation
SimpleImputer
StandardScaler
Optional categorical encoder
LogisticRegression baseline
```

The complete pipeline will be trained as one reproducible object.

---

## Step 7: Train the model

The training command will:

1. Load the raw CSV.
2. Validate its schema.
3. Split the dataset.
4. Fit the preprocessing/model pipeline.
5. Evaluate the model.
6. Save the pipeline.
7. Save metadata and metrics.

---

## Step 8: Evaluate and report

Generate a report containing:

```text
metrics.json
classification report
confusion matrix
feature configuration
training timestamp
model version
```

The MVP should not claim clinical effectiveness based only on the training dataset.

---

## Step 9: Build the prediction interface

The initial interface will be a CLI:

```bash
python app.py predict \
  --model models/diabetes_model.joblib \
  --input data/examples/patient.json
```

The input will be validated before prediction.

---

## Step 10: Add safety controls

The application must:

- Clearly state that it is not a diagnostic system.
- Avoid recommending medication or treatment.
- Avoid claiming certainty.
- Display the model and dataset used.
- Reject incomplete or invalid inputs.
- Avoid storing real patient data by default.
- Keep prediction logs free of unnecessary personal identifiers.

---

## Step 11: Add automated tests

Tests will cover:

```text
Dataset loading
Schema validation
Missing-value handling
Invalid input handling
Model training
Prediction shape
Probability range
Model save/load behavior
CLI command behavior
```

---

## Step 12: Document limitations

Documentation will explain:

- Dataset limitations
- Small-sample limitations
- Bias and representativeness risks
- False positives and false negatives
- Probability calibration limitations
- Non-diagnostic purpose
- Prohibition on using the MVP for clinical decisions

---

# Planned File Structure

```text
disease_predictor/
├── app.py
├── README.md
├── requirements.txt
├── .gitignore
│
├── data/
│   ├── raw/
│   │   └── .gitkeep
│   ├── processed/
│   │   └── .gitkeep
│   └── examples/
│       └── patient.example.json
│
├── models/
│   └── .gitkeep
│
├── reports/
│   └── .gitkeep
│
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
│
└── tests/
    ├── test_data_loader.py
    ├── test_validation.py
    ├── test_preprocessing.py
    ├── test_prediction.py
    └── test_cli.py
```

---

# Proposed Dependencies

```text
pandas
numpy
scikit-learn
joblib
pytest
```

Optional future dependencies:

```text
FastAPI
Uvicorn
Streamlit
```

These should not be added until the CLI MVP is complete.

---

# MVP Completion Criteria

The MVP is complete when:

- `[ ]` A diabetes or heart-disease CSV can be loaded.
- `[ ]` The dataset schema is validated.
- `[ ]` A reproducible Scikit-learn model can be trained.
- `[ ]` Preprocessing and modeling are saved together.
- `[ ]` Evaluation metrics are generated.
- `[ ]` A saved model can make a new prediction.
- `[ ]` Invalid input returns a clear error.
- `[ ]` Tests pass.
- `[ ]` README documentation is complete.
- `[ ]` Safety limitations are displayed with every prediction.
- `[ ]` The application does not present results as medical diagnoses.

I will wait for your command:

```text
CREATE FILES_EACH
```