import random

def predict_machinery_demand():
    return {
        "tractorDemand": random.randint(20, 80),
        "harvesterDemand": random.randint(10, 50),
        "peakHours": ["8 AM", "4 PM"],
        "predictedEarnings": random.randint(5000, 20000)
    }
