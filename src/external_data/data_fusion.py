"""
data_fusion.py
==============
Merges IoT sensor data with
external contextual data.

Week 2 : Contextual Data Fusion
"""

import pandas as pd
import numpy as np
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
    generate_timestamps,
    simulate_weather,
    encode_weather
)

from load_simulator import (
    simulate_factory_load,
    categorize_load
)


# ─────────────────────────────────────────
# FUSION PIPELINE
# ─────────────────────────────────────────

def create_fused_dataset(
    data_filepath: str
) -> pd.DataFrame:
    """
    Merge IoT + weather +
    factory load data.
    """

    print("=" * 50)
    print("🚀 CONTEXTUAL DATA FUSION")
    print("=" * 50)

    # Step 1 — Load IoT data
    print("\n[1] Loading IoT data...")

    X, y, feature_names, iot_df = (
        load_and_preprocess(
            data_filepath
        )
    )

    n_rows = len(iot_df)

    print(
        f"   IoT Shape: "
        f"{iot_df.shape}"
    )

    # Step 2 — Generate timestamps
    print("\n[2] Generating timestamps...")

    timestamps = (
        generate_timestamps(
            n_rows
        )
    )

    iot_df[
        'timestamp'
    ] = timestamps

    # Step 3 — Weather simulation
    print("\n[3] Simulating weather...")

    weather_df = (
        simulate_weather(
            timestamps
        )
    )

    weather_df = (
        encode_weather(
            weather_df
        )
    )

    # Step 4 — Factory load simulation
    print("\n[4] Simulating load...")

    load_df = (
        simulate_factory_load(
            timestamps
        )
    )

    load_df = (
        categorize_load(
            load_df
        )
    )

    # Step 5 — Merge weather
    print("\n[5] Merging weather...")

    fused_df = pd.merge(
        iot_df,
        weather_df.drop(
            columns=[
                'weather_condition'
            ]
        ),
        on='timestamp',
        how='left'
    )

    print(
        f"   Shape after weather: "
        f"{fused_df.shape}"
    )

    # Step 6 — Merge load
    print("\n[6] Merging load...")

    fused_df = pd.merge(
        fused_df,
        load_df.drop(
            columns=[
                'load_category'
            ]
        ),
        on='timestamp',
        how='left'
    )

    print(
        f"   Shape after load: "
        f"{fused_df.shape}"
    )

    # Step 7 — Final cleanup
    fused_df = fused_df.drop(
        columns=['timestamp']
    )

    print("\n✅ Fusion complete!")

    print(
        f"Final Shape: "
        f"{fused_df.shape}"
    )

    return fused_df


def get_fused_arrays(
    fused_df: pd.DataFrame
):
    """
    Split into X, y arrays.
    """

    target_col = (
        'Machine failure'
    )

    feature_names = [
        c for c in fused_df.columns
        if c != target_col
    ]

    X = fused_df[
        feature_names
    ].values

    y = fused_df[
        target_col
    ].values

    return (
        X,
        y,
        feature_names
    )


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

if __name__ == "__main__":

    fused_df = (
        create_fused_dataset(
            'data/ai4i2020.csv'
        )
    )

    X, y, feature_names = (
        get_fused_arrays(
            fused_df
        )
    )

    print(
        f"\n✅ Ready for modeling!"
    )

    print(
        f"X shape: {X.shape}"
    )

    print(
        f"y shape: {y.shape}"
    )

    print(
        f"Features: "
        f"{len(feature_names)}"
    )

    print(
        fused_df.head()
    )