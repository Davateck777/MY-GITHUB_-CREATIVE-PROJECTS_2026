#!/usr/bin/env python3
"""Run the Disease Predictor WebApp with FastAPI."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from model_service import get_catalog, predict

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"

app = FastAPI(title="Disease Predictor WebApp", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
)


@app.get("/api/health")
def api_health() -> dict:
    return {"status": "ok", "service": "disease-predictor-webapp"}


@app.get("/api/datasets")
def api_datasets() -> dict:
    return {"datasets": get_catalog()}


@app.get("/api/model-info")
def api_model_info(dataset: str = "") -> dict:
    selected = next((item for item in get_catalog() if item["id"] == dataset), None)
    if selected is None:
        return {"error": "Dataset must be 'diabetes' or 'heart'."}
    return selected


@app.post("/api/predict")
def api_predict(payload: dict) -> dict:
    dataset = str(payload.get("dataset", "")).strip().lower()
    result = predict(dataset, payload.get("features", {}))
    return {"result": result}


@app.get("/api/predict")
def api_predict_options() -> dict:
    return {"error": "POST /api/predict with a JSON body."}


@app.get("/{full_path:path}")
def serve_static(full_path: str) -> FileResponse:
    if ".." in Path(full_path).parts or full_path.startswith("api/"):
        return FileResponse(STATIC_DIR / "index.html", status_code=404)
    candidate = (STATIC_DIR / full_path).resolve()
    static_root = STATIC_DIR.resolve()
    if static_root not in candidate.parents or not candidate.is_file():
        return FileResponse(STATIC_DIR / "index.html", status_code=404)
    return FileResponse(candidate)


def main() -> None:
    import uvicorn

    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    print(f"Disease Predictor WebApp running at http://{host}:{port}")
    print(f"Static directory: {STATIC_DIR}")
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
