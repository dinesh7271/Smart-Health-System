from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    population_density = Column(Float)


class WeeklyData(Base):
    __tablename__ = "weekly_data"

    id = Column(Integer, primary_key=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    rainfall = Column(Float)
    contamination_index = Column(Float)
    cases = Column(Integer)
    week_date = Column(Date)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True)
    ward_id = Column(Integer)
    risk_score = Column(Float)
    outbreak_flag = Column(Boolean)
    prediction_date = Column(Date)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    ward_id = Column(Integer)
    risk_score = Column(Float)
    created_at = Column(Date)
    is_active = Column(Boolean, default=True)