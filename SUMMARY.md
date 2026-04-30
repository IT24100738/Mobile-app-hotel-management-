Summary of changes

- Hardened RBAC owner checks in `backend/controllers/bookingController.js` and `backend/controllers/reviewController.js`.
- Added unit test support for backend using Jest and created RBAC tests in `backend/tests/`.
- Scaffolding for an Admin Dashboard added under `frontend/admin/` with placeholder CRUD pages and an axios helper.
- Added `DEPLOYMENT.md` with Render and Vercel deployment steps.
- Mobile app navigation now exposes the authenticated user role and hides admin-only tabs for customers.
- Verified backend RBAC unit tests pass with `npm run test:unit`.
- Expo development server is running and advertising a LAN QR URL for Expo Go.

Next recommended steps

- Run `npm ci` in `backend` and run `npm run test:unit` to execute unit tests.
- Expand admin pages to implement create/update/delete operations and add authentication flow.
- Add CI to run unit tests on push.
