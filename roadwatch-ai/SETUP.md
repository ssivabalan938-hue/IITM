# Setup & Running Guide: RoadWatch AI

Welcome to the **AI-Based Road Accident Black Spot Predictor & Safety Intervention System (roadwatch-ai)** setup manual. 

---

## 1. Prerequisites
- **Node.js**: Version 18.x or 20.x (Recommended)
- **NPM**: Version 9.x or 10.x
- **PostgreSQL** (Optional): A running database instance or Neon PostgreSQL. If not available, the system **automatically falls back** to a local file database (`fallback_db.json`) located in the backend.

---

## 2. Directory Structure
```
roadwatch-ai/
├── README.md
├── package.json
├── SETUP.md
├── .gitignore
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── server.ts
│       ├── database/
│       │   └── db.ts (Prisma & JSON Fallback adapter)
│       ├── services/ai/riskEngine.ts (Rule-based AI engine)
│       └── routes/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── src/
        ├── App.tsx
        ├── pages/
        ├── services/
            └── reportService.ts (Programmatic PDF Exporter)
```

---

## 3. Installation

From the project root directory (`roadwatch-ai/`), execute:

```bash
# Install all dependencies for root, backend, and frontend concurrently
npm run install:all
```

---

## 4. Database Setup & Seeding

### Option A: Running with local/hosted PostgreSQL (Neon)
1. Edit the connection string in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/roadwatch?schema=public"
   ```
2. Run Prisma migrations and seed mock hotspots in Tiruchirappalli:
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:seed
   cd ..
   ```

### Option B: Zero-Config Database Fallback (Default out-of-the-box)
If PostgreSQL is not running or no `DATABASE_URL` is set, you can skip database setup entirely!
1. The backend database wrapper (`db.ts`) will detect that the database is unreachable.
2. It will automatically load and seed data into `backend/src/database/fallback_db.json`.
3. To seed/regenerate mock hotspots around Tiruchirappalli, run the seed command:
   ```bash
   # From root directory
   npm run prisma:seed --prefix backend
   ```
   This will write standard hotspots to the JSON database.

---

## 5. Running the Application

Start the backend and frontend dev servers concurrently using the root package:

```bash
# From root directory
npm run dev
```

This launches:
- **Frontend App**: `http://localhost:3000` (Vite dev server)
- **Backend API**: `http://localhost:5000` (Node Express server)

---

## 6. Access Credentials & Testing

### Government Official Account (Pre-seeded)
- **Email**: `officer@trichy.gov.in`
- **Password**: `admin123`
- **Employee ID**: `GOV-TRICHY-001`
- **Department**: Highways & Infrastructure Development
- **Role Status**: `APPROVED` (Full portal features unlocked: Map overlays, AI Popups, threshold setters, PDF downloads, construction Kanbans)

### Sandbox Testing Flow
1. **Citizen Portal**:
   - Sign up a new Citizen account or login.
   - Open the Dashboard to query road safety precautions on the Leaflet map (strict privacy policy hides AI analysis).
   - Go to **Report Issue**. Click on the map in Samayapuram or TVS Tollgate to pin an issue, fill out forms, attach an image, and submit.
2. **Government Portal**:
   - Log in using `officer@trichy.gov.in` / `admin123`.
   - Go to **TAB 1 (Citizen Complaints)**: Observe the submitted complaint.
   - Adjust the **Proximity Threshold** (e.g., set to 1). When complaints count meets/exceeds this limit, click **Run AI Predictor**.
   - Fill in traffic parameters (accidents, PCU speed loads, surface conditions, etc.) and hit execute.
   - Switch to **TAB 2 (AI Risk Prediction)**: Look at the visual heatmap circle overlays and click any marker to inspect the `ATTRIBUTE | VALUE | F1` table popup.
   - Click **Export Safety Audit Report** to download the professional 2-page audit document.
   - Switch to **TAB 3 (Construction Status)**: Manage, advance, and log notes on the Kanban project tracker board.
