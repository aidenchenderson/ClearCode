"""Assignments CRUD via Flask; data stored in Firestore."""
from flask import Blueprint, current_app, jsonify, request
from datetime import datetime, timezone

from server.fb_admin import get_firestore, verify_id_token

import os
import firebase_admin
from firebase_admin import credentials, firestore

def get_firestore():
    try:
        # Initialize only once
        if not firebase_admin._apps:
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if not cred_path:
                print("Missing GOOGLE_APPLICATION_CREDENTIALS")
                return None
            firebase_admin.initialize_app(credentials.Certificate(cred_path))

        return firestore.client()
    except Exception as e:
        print("Firestore init failed:", e)
        return None


def _doc_id_from_add_result(result):
    """Return document id from collection.add() result (DocumentReference or tuple)."""
    if hasattr(result, "id"):
        return str(result.id)
    if isinstance(result, (list, tuple)) and len(result) >= 1:
        first = result[0]
        if hasattr(first, "id"):
            return str(first.id)
    return ""

bp = Blueprint("assignments", __name__, url_prefix="")
COLLECTION = "assignments"
INVITES_COLLECTION = "assignmentInvites"


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











# @bp.route("/by-github-id", methods=["GET"])
# def get_assignments_by_github_id():
#     identity = (request.args.get("identity") or "").strip().lower()
#     current_app.logger.info("[extension] identity=%r", identity)


#     #call the firebase api to get the assignments for the user with the given github id

#     if not identity:
#         return jsonify({"identity": "", "assignments": []}), 200

#     assignments_by_user = {"iainmac32": [{"name": "a1", "id": 932},{"name": "a2", "id": 12}]}

#     assignments = assignments_by_user.get(identity, ["test1assignment"])
#     return jsonify({"identity": identity, "assignments": assignments}), 200




@bp.route("/by-github-id", methods=["GET"])
def get_assignments_by_github_id():
    identity = (request.args.get("identity") or "").strip().lower()
    current_app.logger.info("[extension] identity=%r", identity)
    print("here!")

    if not identity:
        return jsonify({"identity": "", "assignments": []}), 200

    db = get_firestore()
    if db is None:
        print("no db!")
        return jsonify({"error": "Database not configured"}), 503

    try:
        print("db:", db)
        # Query the junction table based on your schema
        invites_ref = db.collection("assignmentInvites")
        docs = invites_ref.where("githubUsername", "==", identity).stream()

        assignments_list = []
        for doc in docs:
            data = doc.to_dict()
            assignments_list.append({
                "id": data.get("assignmentId"),
                "name": data.get("assignmentName")
            })


        print("here!")
        print(jsonify({
            "assignments": assignments_list,
            "identity": identity
        }))
        # Final response matches your requested format
        return jsonify({
            "assignments": assignments_list,
            "identity": identity
        }), 200

    except Exception as e:
        current_app.logger.error("Firestore query failed: %s", e)
        return jsonify({"error": str(e)}), 500







@bp.route("/push", methods=["POST"])
def push_line_event():
    payload = request.get_json(silent=True)
    if payload is None or not isinstance(payload, dict):
        return jsonify({"error": "Expected JSON object"}), 400

    required = ["AssignmentID", "GitHubName", "GitHubLink", "FilePath", "LineNumber", "LineContent"]
    missing = [k for k in required if k not in payload]
    if missing:
        return jsonify({"error": "Missing fields", "missing": missing}), 400

    db = get_firestore()
    if db is None:
        return jsonify({"error": "Database not configured"}), 503

    try:
        event_doc = {
            "assignmentId": str(payload["AssignmentID"]),   # ✅ string
            "githubUsername": str(payload["GitHubName"]).strip().lower(),
            "githubLink": str(payload.get("GitHubLink", "")),
            "filePath": str(payload["FilePath"]),
            "lineNumber": int(payload["LineNumber"]),
            "lineContent": str(payload["LineContent"]),
            "updatedAt": str(payload.get("updatedAt", "")),
        }

        doc_ref = db.collection("lineEvents").document()
        doc_ref.set(event_doc)

        return jsonify({"ok": True, "id": doc_ref.id}), 200

    except Exception as e:
        current_app.logger.exception("Push failed")
        return jsonify({"error": str(e)}), 500


















@bp.route("", methods=["GET"])
def list_assignments():
    """List assignments for the authenticated user."""
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
            invite_snaps = db.collection(INVITES_COLLECTION).where("assignmentId", "==", ref.id).stream()
            invited_count = sum(1 for _ in invite_snaps)
            items.append({
                "id": ref.id,
                "name": d.get("name", ""),
                "description": d.get("description", ""),
                "createdAt": d.get("createdAt", ""),
                "dueDate": d.get("dueDate", ""),
                "isGroup": d.get("isGroup", False),
                "maxGroupSize": d.get("maxGroupSize"),
                "groups": d.get("groups", []),
                "invitedCount": invited_count,
            })
        items.sort(key=lambda x: x.get("dueDate", ""), reverse=True)
        current_app.logger.info("[assignments] GET fetched count=%s", len(items))
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("", methods=["POST"])
def create_assignment():
    """Create an assignment."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    body = request.get_json() or {}
    name = (body.get("name") or "").strip()
    description = (body.get("description") or "").strip()
    created_at = (body.get("createdAt") or "").strip()
    due_date = (body.get("dueDate") or "").strip()
    is_group = bool(body.get("isGroup"))
    max_group_size = body.get("maxGroupSize")
    groups = body.get("groups") or []
    if not name:
        return jsonify({"error": "name is required"}), 400
    if not due_date:
        return jsonify({"error": "dueDate is required"}), 400
    try:
        add_result = db.collection(COLLECTION).add({
            "userId": uid,
            "name": name,
            "description": description,
            "createdAt": created_at,
            "dueDate": due_date,
            "isGroup": is_group,
            "maxGroupSize": max_group_size if is_group else None,
            "groups": groups,
        })
        doc_id = _doc_id_from_add_result(add_result)
        payload = {
            "id": doc_id,
            "name": name,
            "description": description,
            "createdAt": created_at,
            "dueDate": due_date,
            "isGroup": is_group,
            "maxGroupSize": max_group_size,
            "groups": groups or [],
        }
        return jsonify(payload), 201
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": str(e)}), 500


@bp.route("/<assignment_id>", methods=["GET"])
def get_assignment(assignment_id):
    """Get one assignment by id (must belong to user)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        ref = db.collection(COLLECTION).document(assignment_id).get()
        if not ref.exists:
            return jsonify({"error": "Not found"}), 404
        d = ref.to_dict()
        if d.get("userId") != uid:
            return jsonify({"error": "Forbidden"}), 403
        payload = {
            "id": ref.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "createdAt": d.get("createdAt", ""),
            "dueDate": d.get("dueDate", ""),
            "isGroup": d.get("isGroup", False),
            "maxGroupSize": d.get("maxGroupSize"),
            "groups": d.get("groups", []),
        }
        return jsonify(payload), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


LINE_EVENTS_COLLECTION = "lineEvents"


@bp.route("/<assignment_id>/progress", methods=["GET"])
def get_progress_by_assignment_id(assignment_id):
    """Fetch all lineEvents for the given assignment (stored in variable; returns empty JSON for now)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        docs = (
            db.collection(LINE_EVENTS_COLLECTION)
            .where("assignmentId", "==", assignment_id)
            .stream()
        )
        line_events_data = [doc.to_dict() for doc in docs]

        # get the groups

        # form the sessions

        # return output

        print("line_events_data:", line_events_data)
        return jsonify({}), 200
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": str(e)}), 500


@bp.route("/<assignment_id>", methods=["PATCH"])
def update_assignment(assignment_id):
    """Update an assignment (partial)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    doc_ref = db.collection(COLLECTION).document(assignment_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404
    if doc.to_dict().get("userId") != uid:
        return jsonify({"error": "Forbidden"}), 403
    body = request.get_json() or {}
    updates = {}
    if "name" in body:
        updates["name"] = str(body["name"]).strip()
    if "description" in body:
        updates["description"] = str(body["description"]).strip()
    if "dueDate" in body:
        updates["dueDate"] = str(body["dueDate"]).strip()
    if "maxGroupSize" in body:
        v = body["maxGroupSize"]
        updates["maxGroupSize"] = int(v) if v is not None else None
    if "groups" in body:
        updates["groups"] = body["groups"]
    if not updates:
        d = doc.to_dict()
        payload = {
            "id": doc.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "createdAt": d.get("createdAt", ""),
            "dueDate": d.get("dueDate", ""),
            "isGroup": d.get("isGroup", False),
            "maxGroupSize": d.get("maxGroupSize"),
            "groups": d.get("groups", []),
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
            "createdAt": d.get("createdAt", ""),
            "dueDate": d.get("dueDate", ""),
            "isGroup": d.get("isGroup", False),
            "maxGroupSize": d.get("maxGroupSize"),
            "groups": d.get("groups", []),
        }
        return jsonify(payload), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<assignment_id>/invited", methods=["GET"])
def get_invited_students(assignment_id):
    """Get all invited students for an assignment."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        # Verify assignment belongs to user
        assignment_ref = db.collection(COLLECTION).document(assignment_id).get()
        if not assignment_ref.exists:
            return jsonify({"error": "Assignment not found"}), 404
        if assignment_ref.to_dict().get("userId") != uid:
            return jsonify({"error": "Forbidden"}), 403
        
        # Get all invited students from assignmentInvites collection
        invites = db.collection(INVITES_COLLECTION).where("assignmentId", "==", assignment_id).stream()
        items = []
        for invite in invites:
            d = invite.to_dict()
            items.append({
                "id": str(invite.id),
                "githubUsername": d.get("githubUsername", ""),
                "avatarUrl": d.get("avatarUrl"),
                "name": d.get("name"),
                "assignmentName": d.get("assignmentName", ""),
                "invitedAt": d.get("invitedAt", ""),
                "status": d.get("status", "pending"),
            })
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<assignment_id>/invite", methods=["POST"])
def invite_student(assignment_id):
    """Invite a student to an assignment by GitHub username."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    
    body = request.get_json() or {}
    github_username = (body.get("githubUsername") or "").strip().lower()
    avatar_url = body.get("avatarUrl")
    name = body.get("name")
    
    if not github_username:
        return jsonify({"error": "githubUsername is required"}), 400
    
    try:
        # Verify assignment belongs to user
        assignment_ref = db.collection(COLLECTION).document(assignment_id).get()
        if not assignment_ref.exists:
            return jsonify({"error": "Assignment not found"}), 404
        if assignment_ref.to_dict().get("userId") != uid:
            return jsonify({"error": "Forbidden"}), 403
        
        # Check if student already invited
        existing_query = db.collection(INVITES_COLLECTION).where("assignmentId", "==", assignment_id).where("githubUsername", "==", github_username).stream()
        if list(existing_query):
            return jsonify({"error": "Student already invited"}), 409
        
        # Get assignment name
        assignment_name = assignment_ref.to_dict().get("name", "")
        
        # Create invite in assignmentInvites collection
        now = datetime.utcnow().isoformat() + "Z"
        add_result = db.collection(INVITES_COLLECTION).add({
            "assignmentId": assignment_id,
            "assignmentName": assignment_name,
            "githubUsername": github_username,
            "avatarUrl": avatar_url,
            "name": name,
            "status": "pending",
            "invitedAt": now,
        })

        current_app.logger.info("[assignments] Invited %s to assignment %s", github_username, assignment_id)

        doc_id = _doc_id_from_add_result(add_result)
        payload = {
            "id": doc_id,
            "assignmentId": assignment_id,
            "assignmentName": assignment_name or "",
            "githubUsername": github_username,
            "avatarUrl": str(avatar_url) if avatar_url is not None else None,
            "name": str(name) if name is not None else None,
            "status": "pending",
            "invitedAt": now,
        }
        return jsonify(payload), 201
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({"error": str(e)}), 500


@bp.route("/user/<github_username>", methods=["GET"])
def get_assignments_for_user(github_username):
    """Get all assignments assigned to a GitHub user."""
    github_username = (github_username or "").strip().lower()
    if not github_username:
        return jsonify({"error": "github_username is required"}), 400
    
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        # Get all invites for this user
        invites = db.collection(INVITES_COLLECTION).where("githubUsername", "==", github_username).stream()
        assignment_ids = set()
        for invite in invites:
            assignment_ids.add(invite.to_dict().get("assignmentId"))
        
        # Fetch full assignment details
        items = []
        for assignment_id in assignment_ids:
            if not assignment_id:
                continue
            ref = db.collection(COLLECTION).document(assignment_id).get()
            if ref.exists:
                d = ref.to_dict()
                items.append({
                    "id": ref.id,
                    "name": d.get("name", ""),
                    "description": d.get("description", ""),
                    "createdAt": d.get("createdAt", ""),
                    "dueDate": d.get("dueDate", ""),
                    "isGroup": d.get("isGroup", False),
                    "maxGroupSize": d.get("maxGroupSize"),
                    "groups": d.get("groups", []),
                })
        
        current_app.logger.info("[assignments] Fetched %d assignments for user %s", len(items), github_username)
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<assignment_id>", methods=["DELETE"])
def delete_assignment(assignment_id):
    """Delete an assignment (must belong to user)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        doc_ref = db.collection(COLLECTION).document(assignment_id)
        doc = doc_ref.get()
        if not doc.exists:
            return jsonify({"error": "Not found"}), 404
        if doc.to_dict().get("userId") != uid:
            return jsonify({"error": "Forbidden"}), 403
        
        # Delete all invites for this assignment
        invites = db.collection(INVITES_COLLECTION).where("assignmentId", "==", assignment_id).stream()
        for invite in invites:
            invite.reference.delete()
        
        # Delete the assignment
        doc_ref.delete()
        current_app.logger.info("[assignments] Deleted assignment %s", assignment_id)
        return jsonify({"id": assignment_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/<assignment_id>/invite/<invite_id>", methods=["DELETE"])
def delete_invite(assignment_id, invite_id):
    """Delete an invite (must own the assignment)."""
    uid, err = _uid_from_request()
    if err is not None:
        return err[0], err[1]
    db = get_firestore()
    if not db:
        return jsonify({"error": "Database not configured"}), 503
    try:
        # Verify assignment belongs to user
        assignment_ref = db.collection(COLLECTION).document(assignment_id).get()
        if not assignment_ref.exists:
            return jsonify({"error": "Assignment not found"}), 404
        if assignment_ref.to_dict().get("userId") != uid:
            return jsonify({"error": "Forbidden"}), 403
        
        # Delete the invite
        invite_ref = db.collection(INVITES_COLLECTION).document(invite_id)
        invite = invite_ref.get()
        if not invite.exists:
            return jsonify({"error": "Invite not found"}), 404
        if invite.to_dict().get("assignmentId") != assignment_id:
            return jsonify({"error": "Invite does not belong to this assignment"}), 400
        
        invite_ref.delete()
        current_app.logger.info("[assignments] Deleted invite %s from assignment %s", invite_id, assignment_id)
        return jsonify({"id": invite_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
