"""Classrooms CRUD via Flask; data stored in Firestore."""
from flask import Blueprint, current_app, jsonify, request

from server.fb_admin import get_firestore, verify_id_token

bp = Blueprint("classrooms", __name__, url_prefix="")
COLLECTION = "classrooms"


def _uid_from_request():
    """Return (uid, None) on success, or (None, (response, status_code)) on error."""
    auth = request.headers.get("Authorization")
    token = (auth[7:].strip() if auth and auth.startswith("Bearer ") else None) or None
    if not token:
        return None, (jsonify({"error": "Missing Authorization header"}), 401)
    claims = verify_id_token(token)
    if not claims:
        return None, (jsonify({"error": "Invalid or expired token"}), 401)
    return claims.get("uid"), None


@bp.route("", methods=["GET"])
def list_classrooms():
    """List classrooms for the authenticated user."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        refs = db.collection(COLLECTION).where("userId", "==", uid).stream()
        items = []
        for ref in refs:
            d = ref.to_dict()
            items.append({
                "id": ref.id,
                "name": d.get("name", ""),
                "description": d.get("description", ""),
                "students": d.get("students", []),
            })
        items.sort(key=lambda x: x["name"])
        current_app.logger.info("[classrooms] GET fetched count=%s data=%s", len(items), items)
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("", methods=["POST"])
def create_classroom():
    """Create a classroom."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    body = request.get_json() or {}
    name = (body.get("name") or "").strip()
    description = (body.get("description") or "").strip()
    students = body.get("students") or []
    if not name:
        return jsonify({"error": "name is required"}), 400
    try:
        doc_ref, _ = db.collection(COLLECTION).add({
            "userId": uid,
            "name": name,
            "description": description,
            "students": students,
        })
        return jsonify({
            "id": doc_ref.id,
            "name": name,
            "description": description,
            "students": students,
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<classroom_id>", methods=["GET"])
def get_classroom(classroom_id):
    """Get one classroom by id (must belong to user)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        ref = db.collection(COLLECTION).document(classroom_id).get()
        if not ref.exists:
            return jsonify({"error": "Not found"}), 404
        d = ref.to_dict()
        if d.get("userId") != uid:
            return jsonify({"error": "Forbidden"}), 403
        return jsonify({
            "id": ref.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "students": d.get("students", []),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<classroom_id>", methods=["PATCH"])
def update_classroom(classroom_id):
    """Update a classroom (partial)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    doc_ref = db.collection(COLLECTION).document(classroom_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404
    if doc.to_dict().get("userId") != uid:
        return jsonify({"error": "Forbidden"}), 403
    body = request.get_json() or {}
    updates = {}
    if "name" in body:
        updates["name"] = str(body["name"]).strip() or doc.to_dict().get("name", "")
    if "description" in body:
        updates["description"] = str(body["description"]).strip()
    if "students" in body:
        updates["students"] = body["students"]
    if not updates:
        d = doc.to_dict()
        return jsonify({
            "id": doc.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "students": d.get("students", []),
        }), 200
    try:
        doc_ref.update(updates)
        doc = doc_ref.get()
        d = doc.to_dict()
        return jsonify({
            "id": doc.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "students": d.get("students", []),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
