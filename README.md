# AquaWatch CBE – Smart Health & Waterborne Disease Outbreak Prediction System

> **AquaWatch CBE** is an AI-driven health surveillance and waterborne disease outbreak prediction platform designed for Coimbatore District. Built with FastAPI, Scikit-Learn, and React + Vite, it provides real-time risk assessment, predictive analytics, water quality monitoring, and ward-level geographic overlays.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)

---

## 📌 Project Overview & Description

Waterborne disease outbreaks pose significant public health challenges in rapidly growing urban and semi-urban regions like Coimbatore. **AquaWatch CBE** bridges the gap between environmental sensing, public health data (Primary Health Center OPD visits), and predictive artificial intelligence to give local health authorities early warning capabilities.

By correlating key risk indicators—including rainfall volume, water contamination indices, historical case trends, and ward population density—the system forecasts potential outbreak spikes up to **14 days in advance**, enabling proactive chlorination, water treatment, and medical resource deployment.

---

## ✨ Key Features

- 🤖 **AI Outbreak Prediction Engine**: Powered by an ensemble Random Forest classifier predicting risk categories (`Safe`, `Medium`, `Danger`/`Critical`), confidence levels, and projected peak case counts.
- 🗺️ **Interactive Coimbatore Ward Overlay**: Custom vector map covering 20 key wards across Coimbatore District (e.g., Ukkadam, Singanallur, Peelamedu, Saravanampatti, RS Puram, Pollachi) with live risk level color coding, active case badges, and filter toggles.
- 🧪 **Water Quality Index Monitoring**: Live telemetry for critical water parameters including pH levels, Turbidity (NTU), Residual Chlorine (mg/L), *E. coli* count, Nitrates, and Total Dissolved Solids (TDS).
- ⚡ **Early Warning & Alert Feed**: Prioritized real-time alerts flagging turbidity spikes, low residual chlorine levels, and sudden OPD surges.
- 📊 **14-Day Risk Forecasting & Disease Breakdown**: Interactive Recharts visualizations tracking predicted vs. actual cases alongside disease-specific breakdowns (Cholera, Typhoid, Dysentery, Hepatitis A).

---

## 🛠️ Tech Stack & Architecture

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Machine Learning**: [Scikit-Learn](https://scikit-learn.org/), [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Database / ORM**: [SQLAlchemy](https://www.sqlalchemy.org/), [Psycopg2](https://www.psycopg.org/) (PostgreSQL ready)
- **Data Validation**: [Pydantic](https://docs.pydantic.dev/)

### **Frontend**
- **Framework / Library**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Linting**: [ESLint 9](https://eslint.org/)

---

## 📁 Repository Structure

```
Smart-Health-System/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application & API routes
│   │   ├── database.py          # Database setup & connection
│   │   ├── models.py            # SQLAlchemy database models
│   │   ├── schemas.py           # Pydantic data schemas
│   │   ├── ml_model.py          # Machine learning model wrapper
│   │   ├── prediction.py        # Prediction logic
│   │   ├── alert_engine.py      # Alert calculation rules
│   │   ├── wards.py             # Ward metadata
│   │   ├── trained_model.pkl    # Serialized Random Forest model
│   │   └── coimbatore_waterborne_outbreak_dataset_new.csv  # Dataset
│   ├── routes/                  # API route handlers
│   ├── utils/                   # Helper functions
│   ├── requirements.txt         # Python package dependencies
│   └── run.py                   # Server entrypoint script
└── frontend/
    ├── public/                  # Static assets
    ├── src/
    │   ├── App.jsx              # Main dashboard UI component
    │   ├── App.css              # Dashboard styles & variables
    │   ├── api.js               # API service integration
    │   └── main.jsx             # React root entrypoint
    ├── index.html               # HTML entry document
    ├── package.json             # Node dependencies & scripts
    └── vite.config.js           # Vite configuration
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `18.0` or higher (with `npm`)

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   python run.py
   ```
   *The API will start at `http://localhost:8000`. API documentation is available interactively at `http://localhost:8000/docs`.*

---

### 2. Frontend Setup

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web application will be accessible at `http://localhost:5173`.*

---

## 📡 API Reference Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/predict` | Predicts outbreak risk level, confidence score, total cases, and projected peak based on ward telemetry. |
| `GET` | `/risk-graph-2024` | Retrieves 2024 historical outbreak data and predicted risk scores for charting. |
| `GET` | `/health` | Health check endpoint returning backend operational status and ML model loaded state. |

### Example Request (`POST /predict`)
```json
{
  "ward_data": [
    {
      "ward": "Ukkadam",
      "contamination": 65.0,
      "cases": 12,
      "rainfall": 45.0
    },
    {
      "ward": "Singanallur",
      "contamination": 58.0,
      "cases": 8,
      "rainfall": 30.0
    }
  ]
}
```

### Example Response
```json
{
  "risk": "danger",
  "confidence": 87.5,
  "cases": 20,
  "peak": 37
}
```

---

## 🤖 Machine Learning Model & Dataset

- **Model Type**: Random Forest Classifier (`n_estimators=300`, `max_depth=10`, `class_weight="balanced"`)
- **Input Features**:
  - `rainfall_mm`: Weekly rainfall measurements in millimeters
  - `contamination_index`: Water contamination index (0–100 scale)
  - `previous_week_cases`: Active cases reported in the preceding week
  - `population_density`: Population density per square kilometer
- **Target**: `outbreak_next_week` (Binary classification: `0` = Safe/Normal, `1` = Outbreak/High Risk)
- **Dataset File**: `backend/app/coimbatore_waterborne_outbreak_dataset_new.csv`

---

## 🏆 Hackathon Context

This project was developed for the **KPRIET Festaa 2026 Hackathon**.
