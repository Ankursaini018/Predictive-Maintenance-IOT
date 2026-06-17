"""
external_feature_importance.py
==============================
Analyze importance of external context features.

Week 2 Day 2
"""

import pandas as pd
import matplotlib.pyplot as plt

from external_data.data_fusion import (
    create_fused_dataset
)


def analyze_external_features():

    fused_df = create_fused_dataset(
        'data/ai4i2020.csv'
    )

    target = 'Machine failure'

    external_features = [
        'ambient_temp_c',
        'humidity_pct',
        'wind_speed_kmh',
        'air_pressure_hpa',
        'weather_encoded',
        'factory_load',
        'load_encoded'
    ]

    corr = (
        fused_df[
            external_features + [target]
        ]
        .corr()[target]
        .drop(target)
        .sort_values(
            key=abs,
            ascending=False
        )
    )

    print("=" * 50)
    print("EXTERNAL FEATURE IMPORTANCE")
    print("=" * 50)
    print(corr)

    plt.figure(figsize=(8, 5))

    corr.plot(
        kind='barh',
        edgecolor='black'
    )

    plt.title(
        'External Feature Correlation with Failure',
        fontweight='bold'
    )

    plt.xlabel('Correlation')

    plt.tight_layout()

    plt.savefig(
        'src/external_feature_importance.png'
    )

    plt.close('all')

    print("✅ Plot saved!")


if __name__ == "__main__":
    analyze_external_features()