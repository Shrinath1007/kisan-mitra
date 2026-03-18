def generate_crop_specific_tasks(weather, crop):
    tasks = []
    crop_name = crop.get("name", "unknown").lower() if crop else "unknown"
    stage = crop.get("stage", "unknown").lower() if crop else "unknown"

    for w in weather:
        rc = w["rainChance"]
        temp = w["temp"]
        
        task = {
            "date": w["date"],
            "task": f"General monitoring for {crop_name} in {stage} stage.",
            "confidence": 0.5,
            "labor_days": 0,
            "machinery_hours": 0,
            "crop": crop_name
        }

        # --- Logic for Wheat ---
        if "wheat" in crop_name:
            if stage == "sowing":
                if rc > 60:
                    task.update({"task": f"Postpone sowing of {crop_name}; heavy rain expected.", "confidence": 0.9})
                elif temp < 10:
                    task.update({"task": f"Low temperatures may affect {crop_name} germination.", "confidence": 0.7})
                else:
                    task.update({"task": f"Good conditions for sowing {crop_name}.", "confidence": 0.85})
            elif stage == "vegetative":
                if rc < 20:
                    task.update({"task": f"Irrigation needed for {crop_name} at vegetative stage.", "confidence": 0.88, "labor_days": 1, "machinery_hours": 1})
                elif temp > 35:
                     task.update({"task": f"High temperatures may stress {crop_name}. Monitor for wilting.", "confidence": 0.8})
                else:
                    task.update({"task": f"Favorable weather for {crop_name} vegetative growth.", "confidence": 0.8})
            elif stage == "flowering":
                if rc > 50:
                    task.update({"task": f"Risk of lodging for {crop_name} due to rain. Check drainage.", "confidence": 0.85})
                else:
                    task.update({"task": f"Ensure consistent moisture for {crop_name} during flowering.", "confidence": 0.8})

        # --- Logic for Rice ---
        elif "rice" in crop_name:
            if stage in ["vegetative", "flowering"]:
                if rc < 40:
                    task.update({"task": f"Maintain water level in {crop_name} paddies; irrigate.", "confidence": 0.9, "labor_days": 2})
                else:
                    task.update({"task": f"Natural rainfall is sufficient for {crop_name}.", "confidence": 0.85})
            elif stage == "harvesting":
                if rc > 30:
                    task.update({"task": f"Postpone {crop_name} harvesting, rain expected.", "confidence": 0.95})
                else:
                    task.update({"task": f"Ideal dry conditions for harvesting {crop_name}.", "confidence": 0.9})

        # --- Generic Logic ---
        else:
            if rc < 25:
                task.update({"task": "Irrigation may be needed. Check soil moisture.", "confidence": 0.8, "labor_days": 1})
            elif rc > 75:
                task.update({"task": "High chance of heavy rain. Ensure proper drainage.", "confidence": 0.9})
            if temp > 38:
                task.update({"task": "Extreme heat warning. Monitor crops for heat stress.", "confidence": 0.92})

        tasks.append(task)

    return tasks


def generate_crop_tasks(weather):
    # generic version (no crop name)
    return generate_crop_specific_tasks(weather, {"name": "generic"})


def analyze_crop(crop_name, stage, soil_moisture, rainfall_last_7_days):
    """
    Analyze crop health based on parameters.
    Returns a dict with analysis results.
    """
    analysis = {
        "crop": crop_name,
        "stage": stage,
        "health_score": 0.0,
        "recommendations": []
    }

    # Simple logic based on stage and conditions
    if stage == "sowing":
        if soil_moisture < 20:
            analysis["recommendations"].append("Increase irrigation for better germination.")
            analysis["health_score"] = 0.6
        else:
            analysis["recommendations"].append("Soil moisture is adequate for sowing.")
            analysis["health_score"] = 0.8

    elif stage == "vegetative":
        if rainfall_last_7_days > 50:
            analysis["recommendations"].append("Monitor for fungal diseases due to high rainfall.")
            analysis["health_score"] = 0.7
        else:
            analysis["recommendations"].append("Good conditions for vegetative growth.")
            analysis["health_score"] = 0.9

    elif stage == "flowering":
        if soil_moisture < 30:
            analysis["recommendations"].append("Ensure adequate water for flowering.")
            analysis["health_score"] = 0.7
        else:
            analysis["recommendations"].append("Optimal conditions for flowering.")
            analysis["health_score"] = 0.9

    elif stage == "harvesting":
        analysis["recommendations"].append("Prepare for harvest.")
        analysis["health_score"] = 0.8

    else:
        analysis["recommendations"].append("General monitoring recommended.")
        analysis["health_score"] = 0.7

    return analysis
