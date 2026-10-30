"""
NexusFlow — Root Server Runner

Allows running the NexusFlow backend server directly from the project root:
    python run.py
or
    uvicorn backend.app.main:app --port 8000 --reload
"""

import sys
from pathlib import Path
import uvicorn

# Ensure the backend directory is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        app_dir=str(BACKEND_DIR),
    )

