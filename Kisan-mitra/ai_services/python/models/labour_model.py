from datetime import datetime, timedelta

def get_labour_demand_predictions():
    """
    Generates mock 7-day labour demand predictions.
    In a real scenario, this would come from an AI/ML model.
    """
    today = datetime.now()
    predictions = []
    for i in range(7):
        date = today + timedelta(days=i)
        day_of_week = date.strftime("%A")
        
        # Simple mock logic for demand fluctuation
        demand_level = 50 + (i % 3) * 10 + (i % 2) * -5 # Base 50, varies by day
        
        predictions.append({
            "date": date.strftime("%Y-%m-%d"),
            "dayOfWeek": day_of_week,
            "predictedDemand": demand_level,
            "unit": "labourers"
        })
    
    return {
        "title": "7-Day Labour Job Demand Forecast",
        "description": "Predicted demand for various labour types in the upcoming week.",
        "predictions": predictions,
        "demandTypes": [
            {"type": "General Farm Hand", "expectedDemand": "Medium-High"},
            {"type": "Harvesting Specialist", "expectedDemand": "High"},
            {"type": "Pest Control", "expectedDemand": "Low-Medium"},
        ],
        "recommendation": "Focus on upskilling in harvesting techniques for better opportunities."
    }