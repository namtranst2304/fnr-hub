# FNR Hub - AI Workspace

FNR Hub is an intelligent local AI workspace for content fetching, translating, and automation. It features a modern, ultra-flat UI built with **Next.js** and a fast, local AI-powered backend running on **FastAPI** + **Ollama**.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18+) & **Yarn**
- **Python** (3.10+)
- **Ollama** (Running locally)
- *(Optional)* **Docker & Docker Compose**

---

## 🛠️ Getting Started (Manual Setup)

You will need two separate terminal windows for development.

### 1. Database Setup
Ensure you have a PostgreSQL database running. Create a database for the project.

### 2. Configure Environment Variables
You need `.env` files in both `api/` and `web/` directories.

**Backend (`api/.env`):**
```ini
DATABASE_URL=postgresql://user:password@localhost:5432/fnr_hub
# Thêm các biến liên quan đến AI (Ollama URL, Gemini API Key, etc.)
```

**Frontend (`web/.env.local`):**
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Running Backend (FastAPI)
Mở Terminal 1:
```bash
cd api
python -m venv venv
.\venv\Scripts\activate  # (Windows)
# source venv/bin/activate # (Mac/Linux)
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
*The API will run on `http://localhost:8000`*

### 4. Running Frontend (Next.js)
Mở Terminal 2:
```bash
cd web
npm install
npm run dev
```
*The UI will run on `http://localhost:3000`*

---

## 🐳 Running with Docker
If you prefer not to install dependencies manually, you can spin up the entire application stack using Docker Compose:

```bash
docker-compose up -d --build
```
Once the containers are running, access the web UI at `http://localhost:3000`.

---

## 📁 Project Structure
- `/web` - Frontend Next.js Application (React, Tailwind CSS, AI SDK)
- `/api` - Backend Python API (FastAPI, Ollama integration)
- `docker-compose.yml` - Container orchestration for deployment
