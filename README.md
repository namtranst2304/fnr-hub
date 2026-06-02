# FNR Hub - AI Workspace

FNR Hub is an intelligent local AI workspace for content fetching, translating, and automation. It features a modern, ultra-flat UI built with **Next.js** and a fast, local AI-powered backend running on **FastAPI** + **Ollama**.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18+) & **Yarn**
- **Python** (3.10+)
- **Ollama** (Running locally)
- *(Optional)* **Docker & Docker Compose**

---

## 🛠️ Getting Started

### 1. Configure Environment Variables
Copy the `.env.example` file and rename it to `.env`. Make sure to place a copy inside the `web/` folder if Next.js requires specific variables.
```bash
cp .env.example web/.env
```

### 2. Download AI Model
Make sure Ollama is installed and running in the background. Download the required model (e.g., Llama 3) by running this in your terminal:
```bash
ollama run llama3
```

---

## 💻 Running the Project (Manual Setup)

You will need two separate terminal windows for development.

### Backend (FastAPI)
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The API will run on `http://localhost:8000`*

### Frontend (Next.js)
```bash
cd web
yarn install
yarn dev
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
