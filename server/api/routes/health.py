"""Health and readiness for frontend and load balancers."""
from flask import Blueprint, jsonify

bp = Blueprint("health", __name__, url_prefix="")


@bp.route("", methods=["GET"])
@bp.route("/", methods=["GET"])
def health():
    """Liveness: is the app up."""
    return jsonify({"status": "ok", "service": "server"})


@bp.route("/ready", methods=["GET"])
def ready():
    """Readiness: app is ready to serve."""
    return jsonify({"status": "ok"}), 200
