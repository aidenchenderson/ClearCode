"""Flask app: health + GitHub API proxy for the frontend."""
from datetime import datetime
from flask import Flask
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS

from server.config import get_config
from server.api import health_bp, github_bp, classrooms_bp, assignments_bp


def _serialize_value(obj):
    """Convert Firestore/datetime values to JSON-serializable form."""
    if hasattr(obj, "rfc3339"):
        return obj.rfc3339()
    if hasattr(obj, "isoformat") and callable(getattr(obj, "isoformat")):
        return obj.isoformat() + ("Z" if getattr(obj, "tzinfo", None) is None else "")
    if isinstance(obj, datetime):
        return obj.isoformat() + ("Z" if obj.tzinfo is None else "")
    return None


class FirestoreJSONProvider(DefaultJSONProvider):
    """Encode Firestore Timestamp (DatetimeWithNanoseconds) and datetime as ISO strings."""
    def default(self, obj):
        serialized = _serialize_value(obj)
        if serialized is not None:
            return serialized
        return super().default(obj)


def create_app(config=None):
    """Create and configure the Flask app. Config can be overridden for tests."""
    app = Flask(__name__)
    app.json = FirestoreJSONProvider(app)
    conf = (config or get_config())
    app.config.from_object(conf)

    CORS(
        app,
        origins=conf.CORS_ORIGINS,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    api_prefix = conf.API_PREFIX.rstrip("/")
    app.register_blueprint(health_bp, url_prefix=f"{api_prefix}/health")
    app.register_blueprint(github_bp, url_prefix=f"{api_prefix}/github")
    app.register_blueprint(classrooms_bp, url_prefix=f"{api_prefix}/classrooms")
    app.register_blueprint(assignments_bp, url_prefix=f"{api_prefix}/assignments")

    @app.route("/")
    def index():
        return {"message": "Server running", "api": api_prefix}, 200

    return app




# For `flask run` / Gunicorn
app = create_app()
