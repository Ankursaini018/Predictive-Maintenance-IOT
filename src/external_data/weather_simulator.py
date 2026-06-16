"""
weather_simulator.py
====================
Simulates realistic external weather/environment
data aligned with AI4I dataset timestamps.

Infotact DS/ML Internship — Project 1
Week 2 : Contextual Data Fusion
"""

import pandas as pd
import numpy as np
from datetime import timedelta


# ─────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────

RANDOM_SEED    = 42
BASE_TEMP_C    = 25.0
TEMP_STD       = 5.0
BASE_HUMIDITY  = 60.0
HUMIDITY_STD   = 15.0
BASE_WIND      = 12.0
WIND_STD       = 5.0
BASE_PRESSURE  = 1013.0
PRESSURE_STD   = 8.0

# ─────────────────────────────────────────
# TIMESTAMP GENERATOR
# ─────────────────────────────────────────

def generate_timestamps(
    n_rows: int,
    start_date: str = '2024-01-01',
    freq_minutes: int = 10
) -> pd.DatetimeIndex:
    """
    Generate timestamps for each sensor reading.
    """

    start = pd.Timestamp(start_date)

    timestamps = [
        start + timedelta(minutes=i * freq_minutes)
        for i in range(n_rows)
    ]

    return pd.DatetimeIndex(timestamps)

# ─────────────────────────────────────────
# WEATHER SIMULATION
# ─────────────────────────────────────────

def simulate_weather(
    timestamps: pd.DatetimeIndex,
    seed: int = RANDOM_SEED
) -> pd.DataFrame:
    """
    Simulate realistic weather data
    for given timestamps.
    """

    np.random.seed(seed)

    n = len(timestamps)

    # Hour of day
    hours = pd.Series(timestamps).dt.hour.values

    # Daily temperature cycle
    daily_cycle = 4 * np.sin(
        2 * np.pi * (hours - 4) / 24
    )

    # Seasonal cycle
    day_of_year = (
        pd.Series(timestamps)
        .dt.dayofyear
        .values
    )

    seasonal_cycle = 8 * np.sin(
        2 * np.pi * (day_of_year - 80) / 365
    )

    # Ambient temperature
    ambient_temp = (
        BASE_TEMP_C
        + daily_cycle
        + seasonal_cycle
        + np.random.normal(
            0,
            TEMP_STD * 0.3,
            n
        )
    )

    # Humidity
    humidity = (
        BASE_HUMIDITY
        - 0.8 * daily_cycle
        + np.random.normal(
            0,
            HUMIDITY_STD * 0.4,
            n
        )
    )

    humidity = np.clip(
        humidity,
        10,
        100
    )

    # Wind speed
    wind_base = np.random.normal(
        BASE_WIND,
        WIND_STD,
        n
    )

    wind_speed = np.abs(
        pd.Series(wind_base)
        .rolling(3)
        .mean()
        .fillna(BASE_WIND)
    )

    # Pressure
    pressure = (
        BASE_PRESSURE
        + np.random.normal(
            0,
            PRESSURE_STD,
            n
        )
    )

    # Weather condition
    conditions = []

    for h, t in zip(
        humidity,
        ambient_temp
    ):
        if h > 85:
            conditions.append('Rainy')
        elif h > 70:
            conditions.append('Cloudy')
        elif t > 35:
            conditions.append('Hot')
        elif t < 15:
            conditions.append('Cold')
        else:
            conditions.append('Clear')

    weather_df = pd.DataFrame({
        'timestamp': timestamps,
        'ambient_temp_c':
            ambient_temp.round(2),
        'humidity_pct':
            humidity.round(2),
        'wind_speed_kmh':
            wind_speed.round(2),
        'air_pressure_hpa':
            pressure.round(2),
        'weather_condition':
            conditions
    })

    print(
        f"✅ Weather data simulated: "
        f"{weather_df.shape}"
    )

    return weather_df

# ─────────────────────────────────────────
# ENCODE WEATHER CONDITION
# ─────────────────────────────────────────

def encode_weather(
    weather_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Encode categorical weather
    condition to numeric.
    """

    condition_map = {
        'Clear': 0,
        'Cloudy': 1,
        'Rainy': 2,
        'Hot': 3,
        'Cold': 4
    }

    weather_df[
        'weather_encoded'
    ] = weather_df[
        'weather_condition'
    ].map(condition_map)

    print(
        "✅ Weather conditions encoded!"
    )

    return weather_df

# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import os

    sys.path.append(
        os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                '..'
            )
        )
    )

    from preprocessing import (
        load_and_preprocess
    )

    # Load dataset
    _, _, _, df = load_and_preprocess(
       'data/ai4i2020.csv'
    )

    n_rows = len(df)

    # Generate timestamps
    timestamps = generate_timestamps(
        n_rows
    )

    # Simulate weather
    weather_df = simulate_weather(
        timestamps
    )

    weather_df = encode_weather(
        weather_df
    )

    print(
        f"\n✅ Final weather shape: "
        f"{weather_df.shape}"
    )

    print(weather_df.head())