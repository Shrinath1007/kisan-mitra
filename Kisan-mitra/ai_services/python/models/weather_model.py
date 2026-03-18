import requests
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
CITY_DEFAULT = os.getenv("DEFAULT_CITY", "Delhi")


def get_weather_7days(city=None):
    city = city or CITY_DEFAULT

    # Always use synthetic weather to avoid external API timeouts
    # print("🌦 Using synthetic weather to prevent timeouts.")
    # return synthetic_weather()

    # If no API key → return synthetic weather
    if not API_KEY or API_KEY.strip() == "":
        print("⚠️ No OpenWeather API key found. Using synthetic weather.")
        return synthetic_weather()

    # --------------- 1) GEO CODING -----------------
    geo_url = "http://api.openweathermap.org/geo/1.0/direct"
    geo_res = requests.get(geo_url, params={"q": city, "limit": 1, "appid": API_KEY}, timeout=10)

    try:
        geo = geo_res.json()
    except:
        print("⚠️ Invalid geo JSON, using synthetic weather.")
        return synthetic_weather()

    # IF GEO EMPTY → fallback
    if not isinstance(geo, list) or len(geo) == 0:
        print(f"⚠️ City '{city}' not found. Using synthetic weather.")
        return synthetic_weather()

    lat, lon = geo[0].get("lat"), geo[0].get("lon")

    if not lat or not lon:
        print("⚠️ City found but no lat/lon. Using synthetic.")
        return synthetic_weather()

    # --------------- 2) GET 7 DAY WEATHER -----------------
    try:
        weather_url = "https://api.openweathermap.org/data/2.5/onecall"
        weather_res = requests.get(
            weather_url,
            params={
                "lat": lat,
                "lon": lon,
                "exclude": "hourly,minutely,alerts",
                "appid": API_KEY,
            },
            timeout=10,
        )
        data = weather_res.json()
    except:
        print("⚠️ Weather API failed. Using synthetic.")
        return synthetic_weather()

    daily = data.get("daily", [])

    if len(daily) == 0:
        print("⚠️ Daily weather missing. Using synthetic.")
        return synthetic_weather()

    # --------------- FORMAT RESPONSE -----------------
    out = []
    for d in daily[:7]:
        out.append({
            "date": datetime.fromtimestamp(d["dt"]).strftime("%Y-%m-%d"),
            "rainChance": int(d.get("pop", 0) * 100),
            "temp": int(d["temp"]["day"]) if "temp" in d else 25,
        })

    return out


# ------------------ SYNTHETIC WEATHER ---------------------
def synthetic_weather():
    print("🌦 Using synthetic fallback weather")
    out = []
    today = datetime.now()

    for i in range(7):
        d = today + timedelta(days=i)
        out.append({
            "date": d.strftime("%Y-%m-%d"),
            "rainChance": (i * 13) % 90,
            "temp": 25 + (i % 5)
        })

    return out
