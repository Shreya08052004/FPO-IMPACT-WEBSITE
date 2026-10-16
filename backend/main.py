from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.linear_model import LinearRegression

BASE_DIR = Path(__file__).resolve().parent
MODEL = joblib.load(BASE_DIR / "fpo_predictor_model.joblib")
MODEL_COLUMNS = list(joblib.load(BASE_DIR / "model_columns.joblib"))
DF = pd.read_csv(BASE_DIR / "fpo_data_with_ndvi.csv")

app = FastAPI(title="SAT-AGRI FPO Impact API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For a public deployment, replace with your Vercel URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

causal_features = ["Group_Treatment", "Land_Size_Hectares", "Rainfall_Annual_mm", "Soil_Health_Score"]
causal_df = pd.get_dummies(DF, columns=["Group"], drop_first=True)[causal_features + ["Income_Annual"]].dropna()
lr = LinearRegression().fit(causal_df[causal_features], causal_df["Income_Annual"])
TREATMENT_EFFECT = float(lr.coef_[0])

pivot = DF.pivot_table(
    values=["Yield_Kg_Per_Hectare", "Cost_of_Cultivation"],
    index="Group", columns="Time_Period", aggfunc="mean"
)
AVG_YIELD_CHANGE = float(
    pivot.loc["Treatment", ("Yield_Kg_Per_Hectare", "After")] /
    pivot.loc["Treatment", ("Yield_Kg_Per_Hectare", "Before")] - 1
)
AVG_COST_CHANGE = float(
    pivot.loc["Treatment", ("Cost_of_Cultivation", "After")] /
    pivot.loc["Treatment", ("Cost_of_Cultivation", "Before")] - 1
)
AVG_INCOME_CONTROL = float(DF[DF["Group"] == "Control"]["Income_Annual"].mean())
AVG_YIELD_CONTROL = float(DF[DF["Group"] == "Control"]["Yield_Kg_Per_Hectare"].mean())
AVG_COST_CONTROL = float(DF[DF["Group"] == "Control"]["Cost_of_Cultivation"].mean())

class FarmInput(BaseModel):
    land_size: float = Field(2.0, ge=0.5, le=10)
    soil_health: float = Field(5.0, ge=1, le=10)
    rainfall: int = Field(1200, ge=500, le=2500)
    distance_market: float = Field(10, ge=1, le=50)
    has_tractor: bool = False
    credit_access: bool = False
    district: str
    crop: str

def make_input(data: FarmInput) -> pd.DataFrame:
    row = pd.DataFrame(0, index=[0], columns=MODEL_COLUMNS, dtype=float)
    row["Land_Size_Hectares"] = data.land_size
    row["Soil_Health_Score"] = data.soil_health
    row["Rainfall_Annual_mm"] = data.rainfall
    row["Distance_to_Market_KM"] = data.distance_market
    district_col = f"District_{data.district}"
    crop_col = f"Primary_Crop_{data.crop}"
    if district_col in row.columns:
        row[district_col] = 1
    if crop_col in row.columns:
        row[crop_col] = 1
    if data.has_tractor and "Has_Tractor_YES" in row.columns:
        row["Has_Tractor_YES"] = 1
    if data.credit_access and "Access_to_Credit_YES" in row.columns:
        row["Access_to_Credit_YES"] = 1
    if "Time_Period_Before" in row.columns:
        row["Time_Period_Before"] = 0
    return row

@app.get("/")
def root():
    return {"message": "SAT-AGRI API is running", "docs": "/docs"}

@app.get("/api/options")
def options():
    return {
        "districts": sorted(DF["District"].dropna().unique().tolist()),
        "crops": sorted(DF["Primary_Crop"].dropna().unique().tolist()),
    }

@app.get("/api/summary")
def summary():
    treatment = DF[DF["Group"] == "Treatment"]
    ndvi_change = float((treatment["NDVI_After"] - treatment["NDVI_Before"]).mean())
    return {
        "causal_income_increase": TREATMENT_EFFECT,
        "ndvi_change": ndvi_change,
        "model_rmse_label": "~₹4,700 RMSE",
        "farmers": int(DF["Farmer_ID"].nunique()),
        "districts": int(DF["District"].nunique()),
        "avg_yield_change_pct": AVG_YIELD_CHANGE * 100,
        "avg_cost_change_pct": AVG_COST_CHANGE * 100,
    }

@app.get("/api/impact")
def impact(district: str = "All Districts"):
    frame = DF if district == "All Districts" else DF[DF["District"] == district]
    groups = []
    for group in ["Control", "Treatment"]:
        subset = frame[frame["Group"] == group]
        if subset.empty:
            continue
        groups.append({
            "group": group,
            "avg_income": float(subset["Income_Annual"].mean()),
            "avg_yield": float(subset["Yield_Kg_Per_Hectare"].mean()),
            "avg_cost": float(subset["Cost_of_Cultivation"].mean()),
            "credit_yes_pct": float((subset["Access_to_Credit"] == "YES").mean() * 100),
            "training_yes_pct": float((subset["Training_Received"] == "YES").mean() * 100),
        })
    return {"district": district, "groups": groups}

@app.post("/api/predict")
def predict(data: FarmInput):
    row = make_input(data)
    before = row.copy()
    before["Group_Treatment"] = 0
    income_before = float(MODEL.predict(before)[0])
    yield_before = (income_before / AVG_INCOME_CONTROL) * AVG_YIELD_CONTROL
    cost_before = (income_before / AVG_INCOME_CONTROL) * AVG_COST_CONTROL

    after = row.copy()
    after["Group_Treatment"] = 1
    income_after = float(MODEL.predict(after)[0])
    yield_after = yield_before * (1 + AVG_YIELD_CHANGE)
    cost_after = cost_before * (1 + AVG_COST_CHANGE)

    recs = []
    if data.soil_health < 9.5:
        rec_row = after.copy()
        rec_row["Soil_Health_Score"] = min(data.soil_health + 1.0, 10.0)
        recs.append({"title": "Improve soil health by one point", "gain": float(MODEL.predict(rec_row)[0] - income_after)})
    if not data.credit_access and "Access_to_Credit_YES" in MODEL_COLUMNS:
        rec_row = after.copy()
        rec_row["Access_to_Credit_YES"] = 1
        recs.append({"title": "Explore access to agricultural credit", "gain": float(MODEL.predict(rec_row)[0] - income_after)})
    if not data.has_tractor and "Has_Tractor_YES" in MODEL_COLUMNS:
        rec_row = after.copy()
        rec_row["Has_Tractor_YES"] = 1
        recs.append({"title": "Evaluate mechanisation options", "gain": float(MODEL.predict(rec_row)[0] - income_after)})
    recs.sort(key=lambda item: item["gain"], reverse=True)

    return {
        "without_fpo": {
            "income": income_before, "yield": float(yield_before), "cost": float(cost_before)
        },
        "with_fpo": {
            "income": income_after, "yield": float(yield_after), "cost": float(cost_after)
        },
        "income_gain": float(income_after - income_before),
        "yield_change": float(yield_after - yield_before),
        "cost_change": float(cost_after - cost_before),
        "recommendations": recs,
    }
