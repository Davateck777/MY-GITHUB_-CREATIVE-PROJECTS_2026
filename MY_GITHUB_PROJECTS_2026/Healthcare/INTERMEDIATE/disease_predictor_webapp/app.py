#!/usr/bin/env python3
"""Run the Disease Predictor WebApp with Python's standard HTTP server."""

from __future__ import annotations

# -----------------------------------------------------------------------------
# Standard-library imports provide routing, JSON handling, static-file serving,
# and a threaded development server without adding a web framework dependency.
# -----------------------------------------------------------------------------
import json
import mimetypes
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

# -----------------------------------------------------------------------------
# The model service owns model loading, validation, prediction, and metadata.
# Keeping it separate makes the API layer easy to replace with FastAPI/Flask.
# -----------------------------------------------------------------------------
from model_service import get_catalog, predict

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"


# -----------------------------------------------------------------------------
# HTTP response helpers keep every API response JSON-shaped and consistent.
# -----------------------------------------------------------------------------
def send_json(handler: BaseHTTPRequestHandler, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.end_headers()
    if handler.command != "HEAD":
        handler.wfile.write(body)


def read_json(handler: BaseHTTPRequestHandler) -> dict:
    try:
        content_length = int(handler.headers.get("Content-Length", "0"))
        raw_body = handler.rfile.read(content_length) if content_length else b"{}"
        payload = json.loads(raw_body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Request body must be valid JSON.") from exc
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")
    return payload


# -----------------------------------------------------------------------------
# The request handler maps browser requests to the model service or frontend.
# -----------------------------------------------------------------------------
class DiseasePredictorHandler(BaseHTTPRequestHandler):
    server_version = "DiseasePredictorWeb/1.0"

    def log_message(self, format: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_HEAD(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path.startswith("/api/"):
            send_json(self, {}, HTTPStatus.OK)
        else:
            self.serve_static(path)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        query = parse_qs(parsed.query)
        try:
            if path == "/api/health":
                send_json(self, {"status": "ok", "service": "disease-predictor-webapp"})
                return
            if path == "/api/datasets":
                send_json(self, {"datasets": get_catalog()})
                return
            if path == "/api/model-info":
                dataset = query.get("dataset", [""])[0]
                selected = next((item for item in get_catalog() if item["id"] == dataset), None)
                if selected is None:
                    send_json(self, {"error": "Dataset must be 'diabetes' or 'heart'."}, HTTPStatus.BAD_REQUEST)
                else:
                    send_json(self, selected)
                return
            self.serve_static(path)
        except (FileNotFoundError, ValueError, OSError) as exc:
            send_json(self, {"error": str(exc)}, HTTPStatus.BAD_REQUEST)

    def do_POST(self) -> None:
        path = unquote(urlparse(self.path).path).rstrip("/")
        if path != "/api/predict":
            send_json(self, {"error": "API route not found."}, HTTPStatus.NOT_FOUND)
            return
        try:
            payload = read_json(self)
            dataset = str(payload.get("dataset", "")).strip().lower()
            result = predict(dataset, payload.get("features", {}))
            send_json(self, {"result": result})
        except (FileNotFoundError, ValueError, OSError) as exc:
            send_json(self, {"error": str(exc)}, HTTPStatus.BAD_REQUEST)

    # -------------------------------------------------------------------------
    # Static files are restricted to the frontend directory to prevent path
    # traversal while keeping the app deployable as a single Python process.
    # -------------------------------------------------------------------------
    def serve_static(self, path: str) -> None:
        relative = "index.html" if path in ("", "/") else path.lstrip("/")
        if ".." in Path(relative).parts or relative.startswith("api/"):
            send_json(self, {"error": "Not found."}, HTTPStatus.NOT_FOUND)
            return
        file_path = (STATIC_DIR / relative).resolve()
        static_root = STATIC_DIR.resolve()
        if static_root not in file_path.parents or not file_path.is_file():
            send_json(self, {"error": "Not found."}, HTTPStatus.NOT_FOUND)
            return
        content = file_path.read_bytes()
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") else content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)


# -----------------------------------------------------------------------------
# The server binds to all interfaces for local, container, and sandbox preview
# use. PORT can be overridden without changing source code.
# -----------------------------------------------------------------------------
def main() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), DiseasePredictorHandler)
    print(f"Disease Predictor WebApp running at http://{host}:{port}")
    print(f"Static directory: {STATIC_DIR}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
