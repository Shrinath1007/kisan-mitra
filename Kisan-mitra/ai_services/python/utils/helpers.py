# ai_services/python/utils/helpers.py
import math
import random
from datetime import datetime, timedelta

# ------------------------------
# SAFE NUMBER PARSING
# ------------------------------
def safe_number(n, default=0):
    """
    Safely convert any value to a float or int.
    If conversion fails, returns default.
    """
    try:
        if n is None:
            return default
        if isinstance(n, (int, float)):
            return n
        return float(n)
    except:
        return default


# ------------------------------
# DATE UTILS
# ------------------------------
def today_str():
    """Return today's date in YYYY-MM-DD format."""
    return datetime.now().strftime("%Y-%m-%d")


def date_plus(days):
    """Return a date +N days as YYYY-MM-DD."""
    d = datetime.now() + timedelta(days=days)
    return d.strftime("%Y-%m-%d")


def next_7_days():
    """Return the next 7 days as date strings."""
    out = []
    for i in range(7):
        out.append(date_plus(i))
    return out


# ------------------------------
# SYNTHETIC DATA GENERATION
# For fallback when real API or ML model is unavailable
# ------------------------------
def synthetic_random(seed_value=None, min_val=0, max_val=100):
    """
    Deterministic-ish random generator.
    If seed_value provided => repeatable output.
    """
    if seed_value is not None:
        random.seed(seed_value)
    return random.randint(min_val, max_val)


def synthetic_series(length=7, seed_offset=0, low=0, high=10):
    """Create a deterministic random-like series based on date."""
    base = datetime.now().day + seed_offset
    return [synthetic_random(base + i, low, high) for i in range(length)]


# ------------------------------
# NORMALIZATION HELPERS
# Useful for ML models later
# ------------------------------
def normalize(value, min_val, max_val):
    """
    Normalize value to [0,1].
    """
    value = safe_number(value)
    min_val = safe_number(min_val)
    max_val = safe_number(max_val)

    if max_val - min_val == 0:
        return 0
    return (value - min_val) / (max_val - min_val)


def denormalize(value, min_val, max_val):
    """
    Reverse normalization.
    """
    value = safe_number(value)
    return value * (max_val - min_val) + min_val


# ------------------------------
# LOGGING UTIL
# ------------------------------
def log(title, data=None):
    """
    Show clean debug logs for AI output.
    """
    print("\n" + "="*40)
    print("  [AI LOG] =>", title)
    if data is not None:
        print("  ", data)
    print("="*40 + "\n")
