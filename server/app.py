"""Flask app: health + GitHub API proxy for the frontend."""
from flask import Flask
from flask_cors import CORS

from server.config import get_config
from server.api import health_bp, github_bp, classrooms_bp, assignments_bp


def create_app(config=None):
    """Create and configure the Flask app. Config can be overridden for tests."""
    app = Flask(__name__)
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
