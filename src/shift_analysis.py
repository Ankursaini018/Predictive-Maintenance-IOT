"""
shift_analysis.py
=================
Analyzes shift-wise machine failure patterns.

Week 2 : Contextual Data Fusion
"""

import pandas as pd
import matplotlib.pyplot as plt
import sys

sys.path.append('./src')

from external_data.data_fusion import create_fused_dataset
from external_data.weather_simulator import generate_timestamps


def create_shift_column(df):
    """
    Create shift labels from timestamps.
    """

    timestamps = generate_timestamps(len(df))

    shifts = []

    for hour in pd.Series(timestamps).dt.hour:

        if 6 <= hour < 14:
            shifts.append('Morning')

        elif 14 <= hour < 22:
            shifts.append('Evening')

        else:
            shifts.append('Night')

    df = df.copy()
    df['shift'] = shifts

    return df


def analyze_shift_impact(fused_df):

    fused_df = create_shift_column(fused_df)

    print("=" * 50)
    print("SHIFT IMPACT ANALYSIS")
    print("=" * 50)

    shift_stats = (
        fused_df.groupby('shift')
        ['Machine failure']
        .agg(['mean', 'sum', 'count'])
    )

    shift_stats['Failure Rate %'] = (
        shift_stats['mean'] * 100
    ).round(2)

    print(shift_stats)

    sensor_cols = [
        'Torque [Nm]',
        'Tool wear [min]',
        'Rotational speed [rpm]'
    ]

    fig, axes = plt.subplots(
        1,
        3,
        figsize=(15, 5)
    )

    for i, col in enumerate(sensor_cols):

        shift_means = (
            fused_df.groupby('shift')[col]
            .mean()
        )

        shift_means.plot(
            kind='bar',
            ax=axes[i],
            edgecolor='black'
        )

        axes[i].set_title(
            f'{col} by Shift'
        )

    plt.tight_layout()

    plt.savefig(
    'src/shift_sensor_analysis.png'
)

plt.close('all')

print("✅ Plot saved!")


if __name__ == "__main__":

    fused_df = create_fused_dataset(
        'data/ai4i2020.csv'
    )

    analyze_shift_impact(
        fused_df
    )