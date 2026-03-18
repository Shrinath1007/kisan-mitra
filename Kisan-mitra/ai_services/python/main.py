from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from models.weather_model import get_weather_7days
from models.crop_model import (
    analyze_crop,
    generate_crop_tasks,
    generate_crop_specific_tasks
)
from models.machinery_model import predict_machinery_demand
from models.labour_model import get_labour_demand_predictions # New import

from typing import List, Optional
from pydantic import BaseModel


class Crop(BaseModel):
    name: Optional[str] = None
    plantingDate: Optional[str] = None
    stage: Optional[str] = None


class WeatherPayload(BaseModel):
    city: Optional[str] = None
    crops: Optional[List[Crop]] = None


app = FastAPI(title="KisanMitra AI Services", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict/weather")
def predict_weather_and_tasks(payload: WeatherPayload):
    # ---------------- WEATHER ----------------
    city = payload.city or "Delhi"  # Fallback to a default city
    weather = get_weather_7days(city)

    # ---------------- TASKS ----------------
    # 1. General tasks based on weather
    tasks = generate_crop_tasks(weather)

    # 2. Crop-specific tasks
    if payload.crops:
        for crop in payload.crops:
            # The model function expects a dictionary, so we convert the Pydantic model
            crop_dict = crop.model_dump()
            
            # The function signature is (weather, crop), so we pass them in that order
            crop_specific_list = generate_crop_specific_tasks(weather, crop_dict)
            tasks.extend(crop_specific_list)

    return {"weather": weather, "tasks": tasks}


@app.get("/predict/machinery")
def predict_machinery():
    return predict_machinery_demand()


@app.get("/predict/labour") # New endpoint
def predict_labour_demand():
    return get_labour_demand_predictions()


@app.post("/analyze/crop")
def analyze(payload: dict):
    return analyze_crop(
        payload.get("cropName"),
        payload.get("stage"),
        payload.get("soilMoisture"),
        payload.get("rainfallLast7Days")
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True)
