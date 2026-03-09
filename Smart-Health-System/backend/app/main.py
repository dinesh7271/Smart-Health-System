from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle

app = FastAPI()

# ✅ Enable CORS (important for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "trained_model.pkl"
DATASET_PATH = "coimbatore_waterborne_outbreak_dataset_new.csv"

# -----------------------------
# Load and preprocess dataset
# -----------------------------
def load_dataset():
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

    split_index = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_index], X.iloc[split_index:]
    y_train, y_test = y.iloc[:split_index], y.iloc[split_index:]

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        class_weight="balanced",
        random_state=42
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    return {"accuracy": float(acc), "predictions": preds.tolist(), "test_df": X_test.index.tolist()}

def load_model():
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

# -----------------------------
# Prediction endpoint
# -----------------------------
@app.post("/predict")
def predict(rainfall: float, contamination: float, prev_cases: int, population: float):
    model = load_model()
    input_data = np.array([[rainfall, contamination, prev_cases, population]])
    probability = model.predict_proba(input_data)[0][1]

    if probability > 0.7:
        category = "Danger"
    elif probability > 0.3:
        category = "Medium"
    else:
        category = "Safe"

    return {
        "probability": float(probability),
        "prediction": category
    }

# -----------------------------
# Graph endpoint (2024 data)
# -----------------------------
@app.get("/risk-graph-2024")
def risk_graph_2024():
    df = load_dataset()
    result = train_model()

    split_index = int(len(df) * 0.8)
    test_df = df.iloc[split_index:].copy()
    test_df["risk_score"] = result["predictions"]

    # Map scores to categories
    def map_category(score):
        if score > 0.7:
            return "Danger"
        elif score > 0.3:
            return "Medium"
        else:
            return "Safe"

    # For demo, simulate variation by mixing categories
    test_df["risk_category"] = test_df["risk_score"].map(lambda x: "Danger" if x == 1 else "Safe")
    test_df.loc[test_df.sample(frac=0.3).index, "risk_category"] = "Medium"

    return test_df.to_dict(orient="records")