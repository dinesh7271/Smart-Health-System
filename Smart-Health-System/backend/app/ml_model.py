import pandas as pd
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

MODEL_PATH = "trained_model.pkl"
DATASET_PATH = "coimbatore_waterborne_outbreak_dataset_new.csv"

def load_dataset():
    df = pd.read_csv(DATASET_PATH)
    df["week_date"] = pd.to_datetime(df["week_date"])
    df = df.sort_values("week_date")

    # ✅ Trim only 2024 data
    df = df[df["week_date"].dt.year == 2024]

    # ✅ Force more Danger in Sept–Dec for demo
    df.loc[
        (df["week_date"].dt.month.isin([9, 10, 11, 12])) &
        (df["rainfall_mm"] > 40) &
        (df["contamination_index"] > 50),
        "outbreak_next_week"
    ] = 1

    return df

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

    return {"accuracy": float(acc), "predictions": preds.tolist()}

def load_model():
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

def predict_risk(rainfall, contamination, prev_cases, population):
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
        "prediction": category,
        "feature_importance": {
            "rainfall_mm": float(model.feature_importances_[0]),
            "contamination_index": float(model.feature_importances_[1]),
            "previous_week_cases": float(model.feature_importances_[2]),
            "population_density": float(model.feature_importances_[3]),
        }
    }