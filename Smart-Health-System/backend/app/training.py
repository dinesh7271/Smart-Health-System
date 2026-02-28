from fastapi import APIRouter
from app.ml_model import train_model

router = APIRouter()

@router.post("/train-model")
def train():
    acc = train_model()
    return {
        "status": "Model trained successfully",
        "accuracy": acc
    }