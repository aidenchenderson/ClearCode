# Server (Flask)

Flask API: health, GitHub proxy, and **classrooms/assignments** (Firestore via Firebase Admin). All DB operations go through the server; the frontend sends requests with a Bearer token (Firebase ID token).

## Setup

From **project root**:

```bash
pip install -r server/requirements.txt
cp server/.env.example server/.env
# Edit server/.env: set FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON).
```

## Run

From **project root** (so `server` is importable):

```bash
FLASK_APP=server.app flask run --port 5000
# or
python server/run.py
```

## API

- `GET /` – service info
- `GET /api/v1/health` – liveness
- `GET /api/v1/health/ready` – readiness
- `GET /api/v1/github/search/users?q=...` – search GitHub users (no auth)
- `GET /api/v1/github/users/<username>` – get one GitHub user (no auth)

**Classrooms & assignments** (require `Authorization: Bearer <Firebase ID token>`):

- `GET /api/v1/classrooms` – list classrooms for the user
- `POST /api/v1/classrooms` – create classroom (body: name, description, students)
- `GET /api/v1/classrooms/<id>` – get one classroom
- `PATCH /api/v1/classrooms/<id>` – update classroom (body: name?, description?, students?)
- `GET /api/v1/assignments` – list assignments for the user
- `POST /api/v1/assignments` – create assignment (body: name, description, createdAt, dueDate, isGroup, maxGroupSize?, groups)
- `GET /api/v1/assignments/<id>` – get one assignment
- `PATCH /api/v1/assignments/<id>` – update assignment (body: name?, description?, dueDate?, groups?)

Configure CORS and Firebase in `.env` (see `.env.example`). Optional `GITHUB_TOKEN` for higher GitHub API rate limits.
