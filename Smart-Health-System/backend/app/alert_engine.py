from models import Alert
from datetime import date

def process_alert(db, ward_id, risk_score):
    if risk_score > 0.75:  # Danger threshold
        alert = Alert(
            ward_id=ward_id,
            risk_score=risk_score,
            created_at=date.today(),
            is_active=True
        )
        db.add(alert)
    else:
        existing = db.query(Alert).filter(Alert.ward_id == ward_id, Alert.is_active == True).first()
        if existing:
            existing.is_active = False
