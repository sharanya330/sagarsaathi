# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- MERN monorepo with Docker and PM2 options. Backend is Node/Express with MongoDB (GeoJSON/2dsphere). Frontend is React (CRA). Domain: secure, vetted, long-distance trip booking with live tracking and SOS.

Common commands
- Local dev
  - Backend
    - cd backend && npm install
    - Copy env: cp .env.example backend/.env and fill values
    - Dev server (nodemon): npm run server
    - Prod-like start: npm start
  - Frontend
    - cd frontend && npm install
    - Start dev server: npm start
- Tests
  - Frontend (CRA/Jest):
    - All tests: cd frontend && npm test
    - Single test by path pattern: npm test -- --testPathPattern=YourFileName
    - Single test by name regex: npm test -- -t "Your test name"
  - Backend: no test scripts defined
- Build
  - Frontend: cd frontend && npm run build
  - Docker (full stack): docker-compose up -d --build
  - Docker logs: docker-compose logs -f
  - Docker stop: docker-compose down
- PM2 (server management)
  - pm2 start ecosystem.config.js --env production
  - pm2 status | pm2 logs | pm2 restart sagarsaathi-backend

Architecture and code structure
- Repository layout
  - backend/: Express API, Mongoose models, auth, uploads, optional S3/Twilio services
  - frontend/: React SPA (user, driver, admin views)
  - docker-compose.yml: mongodb, backend, frontend, nginx
  - Dockerfile, deploy.sh, ecosystem.config.js
- Backend (Node/Express, ES Modules)
  - Entry: backend/server/server.js
    - Loads env with dotenv, connects Mongo, sets CORS (allowed origins: http://localhost:3000, http://127.0.0.1:3000)
    - Middleware: JSON/urlencoded parsers; static files at /uploads
    - Routes mounted under /api/*: users, drivers, trips, admin, payments, comm
    - Error handler middleware; root GET / returns a simple string
  - Auth middleware: backend/middleware/authMiddleware.js
    - userProtect: Bearer JWT for users
    - driverProtect: Bearer JWT for drivers
    - adminProtect: Bearer JWT with role:'admin'
  - Models: backend/models
    - Drivermodel.js: documents (verification), vehicle, GeoJSON location with 2dsphere index, availability; exports Driver (re-uses existing model if present)
    - Tripmodel.js: user/driver refs, pickup/dropoff and stops as GeoJSON, pricing, status lifecycle (REQUESTED → ACCEPTED → ON_TRIP → COMPLETED/CANCELLED/SOS_ACTIVE), locationHistory, public tracking token; 2dsphere index on pickup
    - usermodel.js, Transaction.js also present
  - Controllers: backend/controllers
    - tripController.js: create/cancel/accept/start/end, SOS, last location, public share token, lead-fee checkout and gating, contact reveal
    - logisticsController.js: live trips aggregation
    - userController.js, driverController.js, paymentsController.js, commController.js
  - Routes: backend/routes
    - tripRoutes.js wires the full trip lifecycle (user and driver protected). Public last location via token
    - adminRoutes.js: env-based admin login, driver verification toggles, active/SOS trips, transactions, resolve SOS
  - Services: backend/services
    - s3.js and twilio.js wrappers (optional integrations)
- Frontend (React)
  - Entry: frontend/src/index.js; App.jsx sets Router and nav
  - Pages: user (RegisterUser, LoginUser, Dashboard, CreateTrip, MyTrips, Track, PublicTrack), driver (DriverRegister, DriverLogin, DriverDashboard, DriverTrips), admin (pages/admin/*)
  - AuthContext provides token/role; ProtectedRoute in App.jsx guards routes
  - socket.io-client is present as a dependency; server-side Socket.IO is not configured in backend at this time

Environments and configuration
- Place runtime env at backend/.env (server loads cwd .env). Use .env.example in repo root as reference
  - Critical: JWT_SECRET, MONGODB_URI (or MONGO_URI in Docker), PORT, ADMIN_EMAIL/ADMIN_PASSWORD, FRONTEND_BASE_URL
  - Optional integrations: Stripe, Twilio, AWS S3, Google Maps
- CORS
  - Allowed origins are hardcoded to http://localhost:3000 and http://127.0.0.1:3000 in backend/server/server.js; keep frontend dev at port 3000 or update allowedOrigins
- Ports
  - Backend defaults to PORT=5000 if not set; .env.example shows 8000. Align PORT with frontend and Docker
  - Frontend dev: 3000
  - Docker maps 5000 (backend), 3000 (frontend), 27017 (Mongo), 80/443 (nginx)

Docker/PM2 deployment notes
- docker-compose.yml defines healthcheck for backend at /health; no /health route exists in server/server.js. Either add a simple GET /health that returns 200 OK or change the compose healthcheck to /
- Nginx expects config and ssl under nginx/; see DEPLOYMENT.md for TLS and reverse proxy details
- PM2 app name sagarsaathi-backend in ecosystem.config.js; script points to ./backend/server.js

Important references from README.md and DEPLOYMENT.md
- README describes the intended MERN architecture with GeoJSON, trip lifecycle, and admin vetting; use it as product context
- DEPLOYMENT.md documents Docker/PM2/Systemd flows, environment variables (JWT, Twilio, S3, Google Maps), and monitoring; prefer those commands in production flows

Troubleshooting hints
- If frontend cannot call API, verify:
  - Backend PORT and CORS allowedOrigins
  - Frontend API base URL (for Docker, REACT_APP_API_URL is set; for local, ensure clients call http://localhost:5000)
- If Docker backend is marked unhealthy, address the /health endpoint mismatch

What’s not configured
- Linting/format scripts are not defined in package.json files
- Backend tests are not present; frontend uses CRA’s default Jest harness
