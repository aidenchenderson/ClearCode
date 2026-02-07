# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/assignments", methods=["GET"])
def assignments():
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

if __name__ == "__main__":
    app.run(port=5000, debug=True)
