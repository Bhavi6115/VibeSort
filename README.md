# 🛡️ ScamShield AI : An AI-Powered Scam Detection & Fraud Prevention Platform
### Detect • Analyze • Protect

[![Live Demo](https://img.shields.io/badge/Live_Demo-https://vibesort--2.onrender.com-38bdf8?style=for-the-badge&logo=render)](https://vibesort-2.onrender.com)
[![Backend API](https://img.shields.io/badge/Backend_API-https://vibesort.onrender.com-22c55e?style=for-the-badge&logo=flask)](https://vibesort.onrender.com)

---

## 📌 Project Overview

**ScamShield AI** is a real‑time scam detection platform that uses artificial intelligence to analyze text messages, emails, and SMS for fraudulent patterns. It provides a risk score, highlights scam indicators (urgency, authority, greed, suspicious links), and maintains a scan history with visual analytics. The system features a futuristic 3D interface and works seamlessly on desktop and mobile devices.

---

## ❗ Problem Statement

Every day, millions of people fall victim to online scams – phishing emails, fake bank alerts, lottery frauds, and urgent “account suspended” messages. Traditional spam filters are not enough; users need an intelligent, explainable tool that can:

- Analyze the **intent** and **psychological triggers** behind a message.
- Provide a **risk score** (0–100%) and clear **indicators** of scam tactics.
- Keep a **history** of analyzed messages for review and learning.
- Work on **any device** without technical expertise.

ScamShield AI solves this by combining NLP‑based scam detection with a beautiful, accessible dashboard.

---

## ✨ Features

- **🧠 AI‑Powered Analysis** – Instantly classifies messages as **Scam** or **Safe** and gives a percentage risk score.
- **📊 Detailed Indicators** – Breaks down the message into four key scam tactics: `Urgency`, `Authority`, `Greed`, `Suspicious Links` – each rated as *low*, *medium*, or *high*.
- **📜 Scan History** – Stores every analyzed message (up to 50) – click on any entry to see full details.
- **📈 Analytics Dashboard** – Visualizes scam/safe ratio, risk score trends, and most common scam indicators.
- **🚨 Real‑Time Alerts** – Configurable sensitivity and risk threshold – get notified immediately when a high‑risk message is detected.
- **📱 Fully Responsive** – Works on mobile, tablet, and desktop with a collapsible sidebar and touch‑friendly controls.
- **🎨 Immersive 3D UI** – Rotating 3D shapes and floating particles powered by Three.js – modern and engaging.

---

## 🧰 Tech Stack

| Layer       | Technologies                                                                 |
|-------------|------------------------------------------------------------------------------|
| **Frontend**| React 18, Tailwind CSS, Three.js (@react-three/fiber), Recharts             |
| **Backend** | Flask (Python 3.10+), Flask‑CORS                                             |
| **AI Model**| Custom `ScamDetector` class (keyword + heuristic‑based)                     |
| **Deployment** | Render (frontend + backend)                                              |
| **Version Control** | Git + GitHub                                                          |

---

## 🛠️ Setup Instructions (Run Locally)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ and pip

### 1. Clone the repository
```bash
git clone https://github.com/Bhavi6115/VibeSort.git
cd deceptra-ai

2. Backend setup
bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install flask flask-cors python-dotenv gunicorn
python app.py
The backend runs at http://localhost:5000

3. Frontend setup
Open another terminal:

bash
cd ../deceptra-frontend
npm install
npm run dev
The frontend runs at http://localhost:5173

4. Connect frontend to local backend
Edit deceptra-frontend/src/App.jsx and change:

js
const API_BASE = 'http://localhost:5000';
Restart the frontend dev server. Now local testing works.

🚀 Deployment on Render (Live Demo)
The live versions are already deployed:

Frontend: https://vibesort-2.onrender.com

Backend: https://vibesort.onrender.com

To deploy your own copy:

Backend (Render)
New Web Service → Connect repo → Root directory: backend

Environment: Python 3 → Build: pip install -r requirements.txt → Start: gunicorn app:app

Frontend (Render)
New Web Service → Root directory: deceptra-frontend

Environment: Node → Build: npm install && npm run build → Publish: dist (or build)

Add env var: REACT_APP_API_URL = https://your-backend-url.onrender.com

Push to main – Render auto‑deploys.

👥 Team Details
Team name: solo sort
Name: Bhavika Vasule

🔗 Live Demo
👉 Try ScamShield AI now – paste a suspicious message and see the AI in action.

