# AquaShield AI 🛡️💧

> **Predictive AI for Waterborne Outbreak Surveillance & Early Warning**
> *Developed for the Smart India Hackathon (SIH)*

AquaShield AI is an enterprise-grade Health Intelligence platform designed to predict, track, and mitigate waterborne disease outbreaks in rural and semi-urban India. By bridging the gap between citizens, health workers, and national authorities, the system transitions public health management from a reactive approach to a proactive, AI-driven model.

---

## 📑 Comprehensive Documentation
All project documentation, including SIH submission materials, can be found in the `docs/sih_submission` directory:

1. **[System Architecture](docs/sih_submission/architecture.md)**: Details the frontend, backend, database, and AI engine layers.
2. **[Database Schema](docs/sih_submission/database_schema.md)**: Entity-Relationship diagram for the PostgreSQL database.
3. **[SIH Presentation Content](docs/sih_submission/sih_ppt_content.md)**: Content and structure for the presentation slides.
4. **[Demo Script](docs/sih_submission/demo_script.md)**: A minute-by-minute guide for the 5-minute judge demonstration.
5. **[Performance Report](docs/sih_submission/performance_report.md)**: Benchmark metrics for API and database response times.

---

## 🚀 Quick Start / Installation Guide

### Prerequisites
- **Node.js** (v18+)
- **Java JDK** (17+)
- **Maven** (3.8+)
- **PostgreSQL** (15+)

### 1. Database Setup
1. Open pgAdmin or `psql`.
2. Create a new database named `aquashield_db`.
3. Create a user `aquashield` with password `password`.
   ```sql
   CREATE DATABASE aquashield_db;
   CREATE USER aquashield WITH ENCRYPTED PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE aquashield_db TO aquashield;
   ```

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Run the Spring Boot application.
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```
3. *Note: Upon first boot, the `DataSeederService` will automatically populate the database with 100 villages, citizens, and active reports.*
4. The backend runs on `http://localhost:8080`.
5. View the API Documentation via Swagger UI at: `http://localhost:8080/swagger-ui.html`.

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies and start the dev server.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. The frontend runs on `http://localhost:5173`.

---

## 📖 User Manual

### Default Demo Credentials
- **Admin**: `admin@aquashield.gov` / `admin123`
- **Field Worker**: `worker1@aquashield.gov` / `worker123`
- **Citizen**: `citizen1@gmail.com` / `citizen123`

### Using the Admin Dashboard (National Command Center)
1. Log in with Admin credentials.
2. Navigate to the **War Room** to view the live India risk map, active alerts, and real-time disease trends.
3. Click on the **Villages** tab to access the **Village Digital Twin** for granular, localized data.
4. Use the **AI Command Center -> Outbreak Simulator** to run "What-If" scenarios based on weather and water contamination variables.
5. In the bottom-left of the sidebar, click **START SIH DEMO** for a hands-free, automated tour of the entire application.

### Using the Citizen Portal
1. Log in with Citizen credentials.
2. Navigate to **Submit Report** to instantly alert authorities of severe symptoms (e.g., Diarrhea, Vomiting).
3. Check the **Dashboard** for real-time notifications or boil-water advisories from the National Command Center.

### Using the Field Worker App
1. Log in with Field Worker credentials.
2. Check **Surveys & Tasks** for dispatched verification requests based on Citizen reports.
3. Submit **Water Quality Tests** (pH, Turbidity, Contamination) directly from the field.

---

## 🚢 Production Deployment

### Docker Orchestration
We have included a `docker-compose.yml` for seamless production deployment.
1. Create a `.env` file in the root directory (use `.env.example` as a template).
2. Run Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
3. This will spin up the PostgreSQL database, the Spring Boot backend, and serve the React frontend via Nginx.

---
*Created for the Smart India Hackathon. AquaShield AI - Protecting lives through predictive intelligence.*
