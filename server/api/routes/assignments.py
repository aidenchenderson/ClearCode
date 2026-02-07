"""Assignments CRUD via Flask; data stored in Firestore."""
from flask import Blueprint, current_app, jsonify, request
from datetime import datetime

from server.fb_admin import get_firestore, verify_id_token

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


@bp.route("/by-github-id", methods=["GET"])
def get_assignments_by_github_id():
    identity = (request.args.get("identity") or "").strip().lower()
    current_app.logger.info("[extension] identity=%r", identity)


    #call the firebase api to get the assignments for the user with the given github id

    if not identity:
        return jsonify({"identity": "", "assignments": []}), 200

    assignments_by_user = {"iainmac32": {"Assignment 1!": "123", "Assignment 2!!": "123"}}

    assignments = assignments_by_user.get(identity, ["test1assignment"])
    return jsonify({"identity": identity, "assignments": assignments}), 200


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
        items.sort(key=lambda x: x.get("dueDate", ""), reverse=True)
        current_app.logger.info("[assignments] GET fetched count=%s data=%s", len(items), items)
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
        doc_ref, _ = db.collection(COLLECTION).add({
            "userId": uid,
            "name": name,
            "description": description,
            "createdAt": created_at,
            "dueDate": due_date,
            "isGroup": is_group,
            "maxGroupSize": max_group_size if is_group else None,
            "groups": groups,
        })
        return jsonify({
            "id": doc_ref.id,
            "name": name,
            "description": description,
            "createdAt": created_at,
            "dueDate": due_date,
            "isGroup": is_group,
            "maxGroupSize": max_group_size,
            "groups": groups,
        }), 201
    except Exception as e:
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
        return jsonify({
            "id": ref.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "createdAt": d.get("createdAt", ""),
            "dueDate": d.get("dueDate", ""),
            "isGroup": d.get("isGroup", False),
            "maxGroupSize": d.get("maxGroupSize"),
            "groups": d.get("groups", []),
        }), 200
    except Exception as e:
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
    if "groups" in body:
        updates["groups"] = body["groups"]
    if not updates:
        d = doc.to_dict()
        return jsonify({
            "id": doc.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "createdAt": d.get("createdAt", ""),
            "dueDate": d.get("dueDate", ""),
            "isGroup": d.get("isGroup", False),
            "maxGroupSize": d.get("maxGroupSize"),
            "groups": d.get("groups", []),
        }), 200
    try:
        doc_ref.update(updates)
        doc = doc_ref.get()
        d = doc.to_dict()
        return jsonify({
            "id": doc.id,
            "name": d.get("name", ""),
            "description": d.get("description", ""),
            "createdAt": d.get("createdAt", ""),
            "dueDate": d.get("dueDate", ""),
            "isGroup": d.get("isGroup", False),
            "maxGroupSize": d.get("maxGroupSize"),
            "groups": d.get("groups", []),
        }), 200
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
                "id": invite.id,
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
        invite_ref = db.collection(INVITES_COLLECTION).add({
            "assignmentId": assignment_id,
            "assignmentName": assignment_name,
            "githubUsername": github_username,
            "avatarUrl": avatar_url,
            "name": name,
            "status": "pending",
            "invitedAt": now,
        })
        
        current_app.logger.info("[assignments] Invited %s to assignment %s", github_username, assignment_id)
        return jsonify({
            "id": invite_ref[1].id,
            "assignmentId": assignment_id,
            "assignmentName": assignment_name,
            "githubUsername": github_username,
            "avatarUrl": avatar_url,
            "name": name,
            "status": "pending",
            "invitedAt": now,
        }), 201
    except Exception as e:
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
