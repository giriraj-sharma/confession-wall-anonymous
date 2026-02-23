# Confession Wall

Simple MERN-style app: Google OAuth authentication, anonymous confessions, reactions, and secret-code protected edit/delete.

Setup

1. Copy `.env.example` to `.env` and fill values (Mongo URI, Google OAuth client ID/secret, session secret).
2. Install dependencies:

```bash
npm install
```

3. Run the server:

```bash
npm run dev
```

Open http://localhost:3000

Notes
- Google OAuth requires you to register a web app in Google Cloud and set redirect URI to `http://localhost:3000/auth/google/callback`.
- Secret codes are hashed with bcrypt. Minimum 4 characters.
- Backend routes:
  - `POST /confessions` (create) - requires login
  - `GET /confessions` (read all)
  - `PUT /confessions/:id` (update with secret code)
  - `DELETE /confessions/:id` (delete with secret code)
  - `POST /confessions/:id/react` (add reaction)
