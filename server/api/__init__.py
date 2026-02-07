"""API package. Register blueprints under the versioned prefix in app factory."""
from server.api.routes.health import bp as health_bp
from server.api.routes.github import bp as github_bp
from server.api.routes.classrooms import bp as classrooms_bp
from server.api.routes.assignments import bp as assignments_bp

__all__ = ["health_bp", "github_bp", "classrooms_bp", "assignments_bp"]
