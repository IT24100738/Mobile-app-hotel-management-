Backend (Render)

1. Create a new Web Service on Render.
2. Connect your Git repo and select the `backend/` folder as the root.
3. Set the build command: `npm ci && npm run build` (if you have a build step) or leave empty.
4. Set the start command: `npm start`.
5. Add environment variables: `MONGO_URI`, `JWT_SECRET`, etc.
6. If using file uploads, configure an external storage (S3) or Render persistent disk.

Admin Dashboard (Vercel)

1. Create a new project on Vercel and link the repo.
2. Set the root directory to `frontend/admin`.
3. Build command: `npm ci && npm run build`.
4. Output directory: `build`.
5. Add environment variables if needed (API base URL).

Notes

- Ensure backend CORS allows the admin domain (Vercel URL).
- For production DB, use a managed MongoDB provider and set `MONGO_URI`.
