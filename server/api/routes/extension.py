"""Assignments CRUD via Flask; data stored in Firestore."""
from flask import Blueprint, current_app, jsonify, request

from server.fb_admin import get_firestore, verify_id_token

bp = Blueprint("extension", __name__, url_prefix="")
COLLECTION = "extension"


@bp.route("/extensionAssignment", methods=["GET"])
def assignmentsList():
    identity = request.args.get("identity")

    if not identity:
        return jsonify({"assignments": []})

    identity = identity.lower()

    # TODO: replace this with DB / real logic
    assignments_by_user = {
        "iainmac32": ["Assignment 1!", "Assignment 2!!"],
        "test": ["test1assignment"]
    }

    assignments = assignments_by_user.get(identity, ["test1assignment"])

    return jsonify({
        "identity": identity,
        "assignments": assignments
    })
