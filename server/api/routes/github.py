"""GitHub API proxy for user lookup and search. Used to validate usernames and fetch profile data."""
import re
import requests
from flask import Blueprint, current_app, jsonify, request

bp = Blueprint("github", __name__, url_prefix="")


def _github_headers():
    headers = {"Accept": "application/vnd.github.v3+json"}
    token = (current_app.config.get("GITHUB_TOKEN") or "").strip()
    if token:
        # GitHub accepts "token" or "Bearer" for PATs
        headers["Authorization"] = f"token {token}"
    return headers


def _has_token():
    """True if GITHUB_TOKEN is set (for logging only; never log the value)."""
    return bool((current_app.config.get("GITHUB_TOKEN") or "").strip())


@bp.route("/search/users", methods=["GET"])
def search_users():
    """Search GitHub users by query (for typeahead). Returns list of { login, avatar_url, name }."""
    q = (request.args.get("q") or "").strip()
    if len(q) < 2:
        return jsonify({"items": []}), 200

    current_app.logger.info("[GitHub search] query=%r token=%s", q, "yes" if _has_token() else "NO")

    # GitHub search: restrict to users, limit results
    url = "https://api.github.com/search/users"
    params = {"q": f"{q} type:user", "per_page": 10}
    try:
        r = requests.get(url, params=params, headers=_github_headers(), timeout=10)
    except requests.RequestException as e:
        current_app.logger.warning("GitHub API request failed: %s", e)
        return jsonify({"error": "GitHub API unavailable", "items": []}), 200

    # Log GitHub response to help debug token / rate limit / errors
    items_count = "n/a"
    gh_msg = ""
    try:
        gh_body = r.json()
        gh_msg = (gh_body.get("message") or "")[:80]
        if r.status_code == 200:
            items_count = len(gh_body.get("items", []))
    except Exception:
        gh_msg = (r.text or "")[:80]
    current_app.logger.info(
        "[GitHub search] response status=%s items_count=%s message=%r",
        r.status_code,
        items_count,
        gh_msg or "(none)",
    )

    if r.status_code == 403:
        # Rate limited or forbidden – return 200 so frontend can show message
        return jsonify({
            "items": [],
            "error": "GitHub rate limit exceeded. Add GITHUB_TOKEN in server/.env for higher limits, or wait a minute.",
        }), 200
    if r.status_code != 200:
        try:
            err = r.json()
            msg = err.get("message", r.text[:200])
        except Exception:
            msg = r.text[:200] if r.text else "GitHub API error"
        return jsonify({"items": [], "error": msg}), 200

    data = r.json()
    items = []
    for u in data.get("items", [])[:10]:
        items.append({
            "login": u.get("login"),
            "avatar_url": u.get("avatar_url"),
            "name": u.get("login"),  # search API doesn't return name; use login
        })
    return jsonify({"items": items}), 200


@bp.route("/users/<username>", methods=["GET"])
def get_user(username):
    """Look up a GitHub user by username. Returns login, avatar_url, name, or 404."""
    username = (username or "").strip()
    if not username or not re.match(r"^[a-zA-Z0-9_-]+$", username):
        return jsonify({"error": "Invalid username"}), 400

    current_app.logger.info("[GitHub user] username=%r token=%s", username, "yes" if _has_token() else "NO")

    url = f"https://api.github.com/users/{username}"
    try:
        r = requests.get(url, headers=_github_headers(), timeout=10)
    except requests.RequestException as e:
        current_app.logger.warning("GitHub API request failed: %s", e)
        return jsonify({"error": "GitHub API unavailable"}), 502

    try:
        gh_body = r.json()
        gh_msg = (gh_body.get("message") or "")[:80]
    except Exception:
        gh_msg = (r.text or "")[:80]
    current_app.logger.info("[GitHub user] response status=%s message=%r", r.status_code, gh_msg or "(none)")

    if r.status_code == 404:
        return jsonify({"error": "User not found on GitHub"}), 404
    if r.status_code != 200:
        return jsonify({"error": "GitHub API error", "detail": r.text}), r.status_code

    data = r.json()
    return jsonify({
        "login": data.get("login"),
        "avatar_url": data.get("avatar_url"),
        "name": data.get("name") or data.get("login"),
    }), 200
