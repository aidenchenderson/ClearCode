"""Classrooms CRUD via Flask; data stored in Firestore."""
from flask import Blueprint, current_app, jsonify, request

from server.fb_admin import get_firestore, verify_id_token


def _doc_id_from_add_result(result):
    """Return document id from collection.add() result (DocumentReference or tuple)."""
    if hasattr(result, "id"):
        return str(result.id)
    if isinstance(result, (list, tuple)) and len(result) >= 1:
        first = result[0]
        if hasattr(first, "id"):
            return str(first.id)
    return ""

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
        current_app.logger.info("[classrooms] GET fetched count=%s", len(items))
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
        add_result = db.collection(COLLECTION).add({
            "userId": uid,
            "name": name,
            "description": description,
            "students": students,
        })
        doc_id = _doc_id_from_add_result(add_result)
        payload = {
            "id": doc_id,
            "name": name,
            "description": description,
            "students": students or [],
        }
        return jsonify(payload), 201
    except Exception as e:
        current_app.logger.exception(e)
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
        payload = {
            "id": ref.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "students": d.get("students", []),
        }
        return jsonify(payload), 200
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
        payload = {
            "id": doc.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "students": d.get("students", []),
        }
        return jsonify(payload), 200
    try:
        doc_ref.update(updates)
        doc = doc_ref.get()
        d = doc.to_dict()
        payload = {
            "id": doc.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "students": d.get("students", []),
        }
        return jsonify(payload), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<classroom_id>", methods=["DELETE"])
def delete_classroom(classroom_id):
    """Delete a classroom (must belong to user)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        doc_ref = db.collection(COLLECTION).document(classroom_id)
        doc = doc_ref.get()
        if not doc.exists:
            return jsonify({"error": "Not found"}), 404
        if doc.to_dict().get("userId") != uid:
            return jsonify({"error": "Forbidden"}), 403
        
        doc_ref.delete()
        current_app.logger.info("[classrooms] Deleted classroom %s", classroom_id)
        return jsonify({"id": classroom_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
