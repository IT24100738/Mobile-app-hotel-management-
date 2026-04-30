# 🏨 WMT Hotel Management App

A full-stack hotel/boarding room management system with:
- **Backend API** (Node.js + Express + MongoDB)
- **Mobile Frontend** (React Native + Expo)

Built for collaborative student team development with role-based API access, room CRUD, and mobile-first UX.

---

## ✨ Highlights

- 📱 Expo-based React Native app (Android/iOS)
- 🧩 Modular Express backend (`routes`, `controllers`, `middleware`, `models`)
- 🔐 JWT authentication with role-based authorization (`user`, `staff`, `admin`)
- 🏠 Room management: list, detail, create, update, delete
- 🖼️ Multer image upload support (`/uploads`)
- 🌐 LAN-ready local development (Expo Go + local backend IP)
- 👥 Team-friendly setup with `.env.example`

---

## 🧱 Tech Stack

### Frontend
- Expo SDK 54
- React Native 0.81.x
- React Navigation

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Bcrypt (`bcryptjs`)
- Multer (file uploads)
- CORS, dotenv

---

## 📂 Project Structure

```text
wmt project/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   └── screens/
│   ├── App.js
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start

## 1) Clone

```bash
git clone https://github.com/DS-02-G07-AI-ML-Project/wmt-hotel-management-app.git
cd wmt-hotel-management-app
```

## 2) Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` with your real values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.rnsmfin.mongodb.net/hotel_management?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=replace_with_strong_secret
```

Run backend:

```bash
npm start
```

Expected output:
- `Server running on http://<your-ip>:5000`
- `MongoDB Connected: ...`

## 3) Frontend Setup

```bash
cd ../frontend
npm install
npx expo install --fix
cp .env.example .env
npx expo start -c --lan
```

Scan QR code with **Expo Go**.

Set this in `frontend/.env` when using deployed backend:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
```

---

## 🌐 Team Development Notes

- Keep backend running on one machine and expose via LAN IP (e.g. `192.168.x.x:5000`)
- Ensure all teammates are on the **same Wi-Fi network** for Expo Go + local API
- In MongoDB Atlas, allow teammate IPs in **Network Access**
- All teammates can share one Atlas cluster using their own `.env`

---

## ☁️ Backend Deployment (Render)

Final evaluation requires hosted backend + mobile app connected to hosted API.

### 1) Create Web Service
- Sign in to Render
- Click **New +** → **Web Service**
- Connect GitHub repo: `DS-02-G07-AI-ML-Project/wmt-hotel-management-app`
- Configure:
	- **Root Directory:** `backend`
	- **Runtime:** `Node`
	- **Build Command:** `npm install`
	- **Start Command:** `npm start`

### 2) Add Environment Variables (Render)

Add in Render dashboard:

```env
NODE_ENV=production
PORT=10000
MONGO_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
PUBLIC_API_URL=https://<your-render-service>.onrender.com
CORS_ORIGIN=https://<your-frontend-origin>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
```

> Render sets `PORT` automatically; keeping `PORT=10000` optional in many setups.

### 3) Deploy and Verify
- Deploy service
- Open: `https://<your-render-service>.onrender.com/`
- Expected response: `Hotel Management API is running...`

### 4) Connect Mobile App to Hosted API

In `frontend/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com
```

Then restart Expo:

```bash
cd frontend
npx expo start -c --lan
```

For final demo, ensure app works **without** local backend running.

---

## 🔐 Authentication & Roles

- `POST /api/users/register` → creates user + returns JWT
- `POST /api/users/login` → returns JWT
- `GET /api/users/me` → requires `Authorization: Bearer <token>`

Security model:
- Public registration always creates `customer` users.
- Admin user creation is handled via protected `POST /api/users`.
- `admin` can manage all records.
- `customer` can only view/update/delete their own bookings, payments, and reviews.

---

## 📡 API Reference

### Base URL (local)

```text
http://<your-ip>:5000
```

### Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | API health check |
| GET | `/health` | Public | JSON health status for monitoring |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/users/register` | Public | Register customer and get JWT |
| POST | `/api/users/login` | Public | Login and get JWT |
| GET | `/api/users/me` | Private | Get current user |
| POST | `/api/users` | Private (`admin`) | Create user with role |
| GET | `/api/users` | Private (`admin`) | List users |
| GET | `/api/users/:id` | Private (`admin`) | Get user by id |
| PUT | `/api/users/:id` | Private (`admin`) | Update user |
| DELETE | `/api/users/:id` | Private (`admin`) | Delete user |

### Rooms

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/rooms` | Public | List all rooms |
| GET | `/api/rooms/:id` | Public | Get room by ID |
| POST | `/api/rooms` | Private (`admin`) | Create room (supports photos upload) |
| PUT | `/api/rooms/:id` | Private (`admin`) | Update room |
| DELETE | `/api/rooms/:id` | Private (`admin`) | Delete room |

### Bookings, Payments, Experiences, Reviews

All 4 modules expose full CRUD routes under:
- `/api/bookings`
- `/api/payments`
- `/api/experiences`
- `/api/reviews`

Role behavior:
- `admin` can perform full CRUD across all records.
- `customer` can perform CRUD only for their own bookings/payments/reviews.
- Experiences remain admin-managed.

---

## 👥 Core 6 Component Use Cases

See the full role-based use-case guide in [USE_CASES.md](USE_CASES.md).

---

## 🖼️ Uploads

- Upload middleware supports image types: `jpeg`, `jpg`, `png`, `gif`
- Max size: **10MB** per file
- Room routes accept up to **5 photos** with field name `photos`
- Static files served from: `/uploads`

---

## 🧪 Common Troubleshooting

### 1) `Network request failed` in Expo Go
- Confirm backend is reachable (hosted URL for final demo)
- If using local fallback, confirm mobile + laptop are on same Wi-Fi
- Confirm `EXPO_PUBLIC_API_BASE_URL` is set correctly for production demo
- Try opening your API root URL in mobile browser

### 2) MongoDB `ECONNREFUSED 127.0.0.1:27017`
- You are likely using local Mongo URI without local Mongo service
- Use MongoDB Atlas URI in `.env`

### 3) Expo package mismatch warnings
Run:

```bash
npx expo install --fix
```

---

## ✅ Smoke Tests

Lightweight checks are now available for both apps.

### Backend smoke test

```bash
cd backend
npm test
```

Validates:
- `.env.example` includes required keys
- JavaScript files parse successfully
- API routers load with registered routes
- backend starts in smoke mode and responds on `GET /`

### Backend CRUD integration test (6 core modules)

```bash
cd backend
npm run test:crud
```

Runs live API CRUD checks against an isolated temporary MongoDB database for:
- Rooms
- Bookings
- Users
- Payments
- Experiences
- Reviews

### Frontend smoke test

```bash
cd frontend
npm test
```

Validates:
- required app/config files exist
- `.env.example` includes expected Expo API keys
- Expo can export an Android bundle (`expo export --platform android`)

---

## 🐳 Docker (Optional)

Run backend + MongoDB locally in production mode:

```bash
docker compose up --build
```

Files included:
- `backend/Dockerfile`
- `backend/.dockerignore`
- `docker-compose.yml`

---

## 🌱 Sample Data

Load linked sample records for all 6 core components:

```bash
cd backend
npm run seed
```

This seeds:
- 3 users
- 3 rooms
- 3 bookings
- 3 payments
- 3 experiences
- 3 reviews

Default demo accounts:
- Admin: `admin@wmt.com` / `AdminPass123!`
- Customer: `customer@wmt.com` / `CustomerPass123!`

---

## 🤝 Collaboration Workflow

```bash
# create your branch
git checkout -b feature/<your-feature>

# commit changes
git add .
git commit -m "feat: add <your-feature>"

# push branch
git push -u origin feature/<your-feature>
```

Then open a Pull Request into `main`.

---

## 🛡️ Security Notes

- Do **not** commit real `.env` files
- Rotate credentials if accidentally shared
- Use strong JWT secret in production
- Restrict CORS and Atlas IP allow-list for production deployments

---

## 📌 Roadmap Ideas

- Booking management module
- Payment integration
- Staff dashboard and analytics
- Media storage migration (S3/Cloudinary)
- CI/CD + automated tests

---

### Maintained by
DS-02 G07 AI/ML Project Team
