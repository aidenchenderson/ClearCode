from flask import Blueprint, current_app, jsonify, request

extension_bp = Blueprint("extension", __name__, url_prefix="")

@extension_bp.get("")
def assignments_list():
    identity = (request.args.get("identity") or "").strip().lower()
    current_app.logger.info("[extension] identity=%r", identity)

    if not identity:
        return jsonify({"identity": "", "assignments": []}), 200

    assignments_by_user = {
        "iainmac32": ["Assignment 1!", "Assignment 2!!"],
        "test": ["test1assignment"],
    }

    assignments = assignments_by_user.get(identity, ["test1assignment"])
    return jsonify({"identity": identity, "assignments": assignments}), 200
