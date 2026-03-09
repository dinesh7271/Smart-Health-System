from fastapi import APIRouter
from datetime import date
from app.database import SessionLocal
from app.models import WeeklyData, Prediction
from app.ml_model import predict_risk
from app.alert_engine import process_alert

router = APIRouter()

@router.post("/generate-predictions")
def generate_predictions():
    db = SessionLocal()
    latest_data = db.query(WeeklyData).all()

    results = []

    for data in latest_data:
        features = [
            data.rainfall,
            data.contamination_index,
            data.cases
        ]

        risk = predict_risk(features)

        prediction = Prediction(
            ward_id=data.ward_id,
            risk_score=risk,
            outbreak_flag=risk > 0.75,
            prediction_date=date.today()
        )

        db.add(prediction)
        process_alert(data.ward_id, risk)

        results.append({
            "ward_id": data.ward_id,
            "risk_score": risk
        })

    db.commit()
    db.close()

    return {"predictions": results}