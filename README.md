# 🚦 ROADWATCH AI

**AI-Powered Road Safety & Black Spot Detection System**

RoadWatch AI is an intelligent road safety platform that helps identify accident-prone locations, prioritize interventions, and improve transparency between citizens and government authorities.

The system transforms traditional reactive road maintenance into a proactive and data-driven road safety ecosystem.

---

## 🎯 Problem Statement

Road accidents frequently occur due to:

- Delayed identification of dangerous road conditions
- Lack of predictive risk assessment
- Poor visibility into infrastructure interventions
- Limited coordination between citizens and authorities

Most existing systems respond only after accidents occur.

**RoadWatch AI aims to prevent accidents before they happen.**

---

## 💡 Solution Overview

RoadWatch AI combines:

- **Citizen Participation**
- **AI-Based Risk Analysis**
- **Government Decision Support**
- **Construction Progress Monitoring**

into a unified platform for road safety management.

---

## 🔄 System Workflow

```
Citizen Reports Road Issue
         ↓
Complaint Threshold Detection
         ↓
    AI Risk Analysis
         ↓
Government Review & Approval
         ↓
Construction Status Tracking
         ↓
Citizen Road Status Updates
```

---

## Key Features

### 🤖 AI Risk Prediction

- Risk Assessment
- Priority Ranking
- High-Risk Location Detection

### 📍 Citizen Reporting Portal

- Road Issue Reporting
- Location-Based Complaints
- Image Evidence Submission

### 🏛 Government Dashboard

- Complaint Review
- Project Approval
- Construction Monitoring

### 🚧 Construction Status Tracking

- Progress Monitoring
- Status Updates
- Project Completion Tracking

### ⚠ Complaint Threshold System

- Automatic Escalation
- Risk Identification
- Priority-Based Processing

### 👁 Citizen Transparency

- Road Status Visibility
- Construction Progress Updates
- Issue Resolution Tracking

---

## 🏗 System Architecture

```
       Citizen Portal
            ↓
    Complaint Database
            ↓
 AI Risk Prediction Engine
            ↓
   Government Dashboard
            ↓
Construction Status Tracking
            ↓
 Citizen Road Status Updates
```

---

## 🖥 Technology Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Leaflet
- React Leaflet
- Chart.js

### Backend

- Node.js
- Express.js
- JWT Authentication

### Database

- PostgreSQL
- Prisma ORM

### Storage

- Cloudinary / Local Storage

### Deployment

- Vercel
- Render
- Neon PostgreSQL

---

## 📂 Project Structure

```
roadwatch-ai/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── docs/
├── README.md
└── .gitignore
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone <repository-url>
cd roadwatch-ai
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### Database Setup

Create a `.env` file inside backend:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Run Prisma:

```bash
npx prisma generate
npx prisma migrate dev
```

---

## 📊 Modules

### Citizen Portal

- Register/Login
- Report Road Issues
- Upload Images
- Track Complaints
- View Road Status

### Government Portal

- Complaint Review
- AI Risk Analysis
- Project Approval
- Construction Monitoring
- Report Generation

---

## 🎯 Expected Impact

- Faster Identification of Road Risks
- Improved Government Response
- Data-Driven Infrastructure Decisions
- Enhanced Citizen Participation
- Increased Road Safety Awareness

---

## 🔮 Future Enhancements

- Machine Learning Models
- Multi-City Deployment
- Satellite Road Monitoring
- Live Traffic Integration
- IoT Sensor Support
- Government GIS Integration

---

## 👥 Team

**RoadWatch AI Development Team**

SRM Institute of Science and Technology

---

## 📜 License

This project was developed for academic and hackathon purposes.
