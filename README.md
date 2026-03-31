# 🛡️ ScamShield AI

A full‑stack scam detection system that analyzes messages and URLs using a hybrid AI model.  
It combines a **Random Forest classifier** for URLs with a **rule‑based text detector** for messages without links.  
The frontend features a 3D animated dashboard, step‑by‑step analysis, history, alerts, and user authentication.

---

## ✨ Features

- **AI‑Powered Scam Detection** – Trained on phishing/legitimate URLs (accuracy ~99%)  
- **Text‑Based Analysis** – Keyword scoring for urgency, authority, greed, and links  
- **Interactive Dashboard** – Charts (pie, bar, line) showing statistics, risk trends, and indicator breakdowns  
- **Step‑by‑Step Scanner** – Real‑time visual progress during analysis  
- **Persistent History** – Each user’s scans are saved and viewable in a clickable list  
- **Alerts System** – Configurable risk threshold and sensitivity (Low/Medium/High)  
- **User Authentication** – JWT‑based login/register with SQLite (password hashed with bcrypt)  
- **3D Background** – Animated dodecahedron and floating particles powered by `@react-three/fiber`  

---

## 🧰 Tech Stack

### Backend
- Flask (Python)
- Flask‑JWT‑Extended
- Flask‑CORS
- SQLite
- scikit‑learn (Random Forest)
- bcrypt

### Frontend
- React (Create React App)
- Recharts
- @react-three/fiber
- Tailwind CSS (optional, but used in this code)

---

## 📦 Prerequisites

- **Node.js** (v16 or later)  
- **Python** (v3.8 or later)  
- **pip** (Python package manager)  
- **Git** (optional)

---

