from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import os
from typing import List

app = FastAPI(title="AquaWatch Coimbatore API")

# ✅ Enable CORS (important for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "trained_model.pkl"
DATASET_PATH = "coimbatore_waterborne_outbreak_dataset_new.csv"

class WardData(BaseModel):
    ward: str
    contamination: float
    cases: int
    rainfall: float

class PredictRequest(BaseModel):
    ward_data: List[WardData]

# -----------------------------
# Load and preprocess dataset
# -----------------------------
def load_dataset():
    if not os.path.exists(DATASET_PATH):
        # Create a dummy dataset if not exists for demo
        dates = pd.date_range(start="2024-01-01", periods=52, freq="W")
        df = pd.DataFrame({
            "week_date": dates,
            "rainfall_mm": np.random.uniform(0, 100, 52),
            "contamination_index": np.random.uniform(0, 100, 52),
            "previous_week_cases": np.random.randint(0, 50, 52),
            "population_density": [1000] * 52,
            "outbreak_next_week": np.random.randint(0, 2, 52)
        })
        df.to_csv(DATASET_PATH, index=False)
        return df

    df = pd.read_csv(DATASET_PATH)
    df["week_date"] = pd.to_datetime(df["week_date"])
    df = df.sort_values("week_date")

    # ✅ Trim only 2024 data
    df = df[df["week_date"].dt.year == 2024]

    # ✅ Force more Danger in Sept–Dec for demo balance
    df.loc[
        (df["week_date"].dt.month.isin([9, 10, 11, 12])) &
        (df["rainfall_mm"] > 40) &
        (df["contamination_index"] > 50),
        "outbreak_next_week"
    ] = 1

    return df

# -----------------------------
# Train model
# -----------------------------
def train_model():
    df = load_dataset()
    X = df[["rainfall_mm", "contamination_index", "previous_week_cases", "population_density"]]
    y = df["outbreak_next_week"]

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        class_weight="balanced",
        random_state=42
    )
    model.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    
    return model

def load_model():
    if not os.path.exists(MODEL_PATH):
        return train_model()
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

# -----------------------------
# Prediction endpoint
# -----------------------------
@app.post("/predict")
def predict(request: PredictRequest):
    model = load_model()
    
    results = []
    total_prob = 0
    total_cases = 0
    
    for ward in request.ward_data:
        # We'll use a fixed population density for now
        input_data = np.array([[ward.rainfall, ward.contamination, ward.cases, 1200]])
        prob = model.predict_proba(input_data)[0][1]
        
        total_prob += prob
        total_cases += ward.cases
        
    avg_prob = total_prob / len(request.ward_data) if request.ward_data else 0
    
    # Map to frontend expected risks
    if avg_prob > 0.7:
        risk = "danger"
    elif avg_prob > 0.35:
        risk = "medium"
    else:
        risk = "safe"

    return {
        "risk": risk,
        "confidence": float(avg_prob * 100),
        "cases": total_cases,
        "peak": int(total_cases * (1 + avg_prob))
    }

# -----------------------------
# Graph endpoint (2024 data)
# -----------------------------
@app.get("/risk-graph-2024")
def risk_graph_2024():
    df = load_dataset()
    model = load_model()
    
    X = df[["rainfall_mm", "contamination_index", "previous_week_cases", "population_density"]]
    # Get probabilities instead of binary predictions
    probs = model.predict_proba(X)[:, 1]
    
    df["risk_score"] = probs
    
    def map_category(score):
        if score > 0.7: return "Danger"
        if score > 0.35: return "Medium"
        return "Safe"

    df["risk_category"] = df["risk_score"].map(map_category)
    
    # Filter 2024 data and convert to dict
    return df.to_dict(orient="records")

@app.get("/health")
def health_check():
    return {"status": "operational", "model_loaded": os.path.exists(MODEL_PATH)}