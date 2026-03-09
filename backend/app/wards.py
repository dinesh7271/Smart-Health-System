from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Ward, Prediction
from datetime import datetime

router = APIRouter()

@router.get("/risk-summary")
def risk_summary():
    db = SessionLocal()
    wards = db.query(Ward).all()
    data = []

    for ward in wards:
        latest = db.query(Prediction).filter(
            Prediction.ward_id == ward.id
        ).order_by(Prediction.id.desc()).first()

        if latest:
            if latest.risk_score > 0.7:
                category = "Danger"
            elif latest.risk_score > 0.3:
                category = "Medium"
            else:
                category = "Safe"

            data.append({
                "ward_id": ward.id,
                "ward_name": ward.name,
                "risk_score": latest.risk_score,
                "risk_category": category,
                "alert_status": latest.outbreak_flag
            })

    db.close()
    return data

@router.get("/risk-summary-range")
def risk_summary_range(start_date: str, end_date: str):
    db = SessionLocal()
    wards = db.query(Ward).all()
    data = []

    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    for ward in wards:
        preds = db.query(Prediction).filter(
            Prediction.ward_id == ward.id,
            Prediction.prediction_date >= start,
            Prediction.prediction_date <= end
        ).all()

        for p in preds:
            if p.risk_score > 0.7:
                category = "Danger"
            elif p.risk_score > 0.3:
                category = "Medium"
            else:
                category = "Safe"

            data.append({
                "ward_id": ward.id,
                "ward_name": ward.name,
                "risk_score": p.risk_score,
                "risk_category": category,
                "alert_status": p.outbreak_flag,
                "date": p.prediction_date
            })

    db.close()
    return data