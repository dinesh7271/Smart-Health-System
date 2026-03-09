from pydantic import BaseModel
from typing import Dict

class TrainingResponse(BaseModel):
    status: str
    accuracy: float

class RiskSummary(BaseModel):
    ward_id: int
    ward_name: str
    risk_score: float
    risk_category: str   # "Safe", "Medium", "Danger"
    alert_status: bool
    date: str

class WardDetail(BaseModel):
    ward_name: str
    risk_score: float
    rainfall: float
    contamination_index: float
    last_week_cases: int
    feature_contribution: Dict[str, float]
