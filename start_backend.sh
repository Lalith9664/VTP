#!/usr/bin/env bash
# Run from anywhere — this script always resolves to the VTP root.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
uv run uvicorn app.main:app --app-dir BACKEND --host 0.0.0.0 --port 8000 --reload
