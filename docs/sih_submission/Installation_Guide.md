# AquaShield AI - Installation & Deployment Guide

## Prerequisites
- **Node.js** (v18+)
- **Java JDK** (17+)
- **Maven** (3.8+)
- **PostgreSQL** (15+)
- **Docker & Docker Compose** (Optional, for production deployment)

## Local Development Setup

### 1. Database Setup
1. Open pgAdmin or `psql`.
2. Create the database and user:
   ```sql
   CREATE DATABASE aquashield_db;
   CREATE USER aquashield WITH ENCRYPTED PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE aquashield_db TO aquashield;
   ```

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Ensure `application.properties` has the correct database credentials.
3. Build and run:
   ```bash
   cd backend
   mvn clean install -DskipTests
   mvn spring-boot:run
   ```
4. *Data Seeding:* The application will automatically seed 100 villages, 500 citizens, and active reports upon the first boot.
5. The API will be available at `http://localhost:8080`.

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at `http://localhost:5173`.

---

## Production Deployment (Docker)

AquaShield AI uses Docker Compose to orchestrate the Database, Spring Boot backend, and Nginx React frontend.

1. Ensure Docker Desktop or Docker Engine is running.
2. In the root directory, copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Build and start the containers in detached mode:
   ```bash
   docker-compose up --build -d
   ```
4. **Access the Application**:
   - Frontend UI: `http://localhost` (Port 80)
   - Backend API: `http://localhost:8080`
5. **View Logs**:
   ```bash
   docker-compose logs -f
   ```
6. **Stop Services**:
   ```bash
   docker-compose down
   ```
