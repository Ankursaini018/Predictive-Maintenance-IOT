"""
load_simulator.py
=================
Simulates realistic factory load
conditions aligned with timestamps.

Infotact DS/ML Internship — Project 1
Week 2 : Contextual Data Fusion
"""

import pandas as pd
import numpy as np


# ─────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────

RANDOM_SEED = 42

SHIFT_LOAD = {
    'night': 0.55,
    'morning': 0.80,
    'afternoon': 0.95,
    'evening': 0.70
}

# ─────────────────────────────────────────
# FACTORY LOAD SIMULATION
# ─────────────────────────────────────────

def simulate_factory_load(
    timestamps: pd.DatetimeIndex,
    seed: int = RANDOM_SEED
) -> pd.DataFrame:
    """
    Simulate realistic factory load
    conditions based on shifts.
    """

    np.random.seed(seed)

    hours = pd.Series(
        timestamps
    ).dt.hour.values

    load_factor = []

    for hour in hours:

        # Shift schedule
        if 0 <= hour < 6:
            base_load = SHIFT_LOAD['night']

        elif 6 <= hour < 12:
            base_load = SHIFT_LOAD['morning']

        elif 12 <= hour < 18:
            base_load = SHIFT_LOAD['afternoon']

        else:
            base_load = SHIFT_LOAD['evening']

        # Add noise
        noisy_load = (
            base_load
            + np.random.normal(
                0,
                0.08
            )
        )

        load_factor.append(
            np.clip(
                noisy_load,
                0.30,
                1.20
            )
        )

    load_df = pd.DataFrame({
        'timestamp': timestamps,
        'factory_load':
            np.round(
                load_factor,
                3
            )
    })

    print(
        f"✅ Factory load simulated: "
        f"{load_df.shape}"
    )

    return load_df

# ─────────────────────────────────────────
# LOAD CATEGORY
# ─────────────────────────────────────────

def categorize_load(
    load_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Categorize factory load
    into Low / Medium / High.
    """

    conditions = []

    for load in load_df[
        'factory_load'
    ]:

        if load < 0.60:
            conditions.append(
                'Low'
            )

        elif load < 0.85:
            conditions.append(
                'Medium'
            )

        else:
            conditions.append(
                'High'
            )

    load_df[
        'load_category'
    ] = conditions

    category_map = {
        'Low': 0,
        'Medium': 1,
        'High': 2
    }

    load_df[
        'load_encoded'
    ] = load_df[
        'load_category'
    ].map(category_map)

    print(
        "✅ Factory load categorized!"
    )

    return load_df

# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import os

    # Add src path
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

    from weather_simulator import (
        generate_timestamps
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

    # Simulate load
    load_df = simulate_factory_load(
        timestamps
    )

    load_df = categorize_load(
        load_df
    )

    print(
        f"\n✅ Final load shape: "
        f"{load_df.shape}"
    )

    print(load_df.head())