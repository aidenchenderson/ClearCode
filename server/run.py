"""Run the dev server from repo root: python server/run.py or python -m server.run"""
import os
import sys

# Ensure project root is on path when running as script
_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _root not in sys.path:
    sys.path.insert(0, _root)

from server.app import app

# Exclude Python stdlib/site-packages from reloader so Windows/IDE touching them doesn't restart the server
_RELOADER_EXCLUDE = [
    "*PythonSoftwareFoundation*",
    "*site-packages*",
    "*__pycache__*",
]

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True),
        exclude_patterns=_RELOADER_EXCLUDE,
    )
