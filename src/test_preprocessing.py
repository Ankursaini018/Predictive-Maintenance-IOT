"""
test_preprocessing.py
=====================
Basic unit tests for preprocessing pipeline.
"""

import pandas as pd
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(__file__))

from preprocessing import (
    add_rolling_features,
    add_domain_features,
    add_lag_features,
    add_roc_features,
    add_outlier_flags,
    clean_dataframe,
    SENSOR_COLS
)


def make_dummy_df(n=100):
    """Create a dummy dataframe for testing."""

    np.random.seed(42)

    df = pd.DataFrame({
        "Air temperature [K]":
            np.random.normal(300, 2, n),

        "Process temperature [K]":
            np.random.normal(310, 2, n),

        "Rotational speed [rpm]":
            np.random.normal(1500, 100, n),

        "Torque [Nm]":
            np.random.normal(40, 5, n),

        "Tool wear [min]":
            np.random.randint(0, 250, n),

        "Type":
            np.random.choice(["L", "M", "H"], n),

        "Machine failure":
            np.random.choice(
                [0, 1],
                n,
                p=[0.97, 0.03]
            ),

        "UDI":
            range(n),

        "Product ID":
            [f"M{i}" for i in range(n)],

        "TWF": 0,
        "HDF": 0,
        "PWF": 0,
        "OSF": 0,
        "RNF": 0
    })

    return df


def test_rolling_features():
    df = make_dummy_df()

    df = add_rolling_features(df)

    roll_cols = [
        c for c in df.columns
        if "roll" in c
    ]

    assert len(roll_cols) == len(SENSOR_COLS) * 3

    print("✅ test_rolling_features passed!")


def test_domain_features():
    df = make_dummy_df()

    df = add_domain_features(df)

    assert "power" in df.columns
    assert "temp_delta" in df.columns
    assert "type_encoded" in df.columns

    print("✅ test_domain_features passed!")


def test_lag_features():
    df = make_dummy_df()

    df = add_domain_features(df)
    df = add_lag_features(df)

    lag_cols = [
        c for c in df.columns
        if "lag" in c
    ]

    assert len(lag_cols) > 0

    print("✅ test_lag_features passed!")


def test_outlier_flags():
    df = make_dummy_df()

    df = add_outlier_flags(df)

    assert "total_anomaly_score" in df.columns

    print("✅ test_outlier_flags passed!")


def test_clean_dataframe():
    df = make_dummy_df()

    df = add_rolling_features(df)
    df = add_domain_features(df)
    df = add_lag_features(df)
    df = add_roc_features(df)
    df = add_outlier_flags(df)

    df = clean_dataframe(df)

    assert df.isnull().sum().sum() == 0

    print("✅ test_clean_dataframe passed!")


if __name__ == "__main__":

    print("=" * 40)
    print("RUNNING UNIT TESTS")
    print("=" * 40)

    test_rolling_features()
    test_domain_features()
    test_lag_features()
    test_outlier_flags()
    test_clean_dataframe()

    print("=" * 40)
    print("✅ ALL TESTS PASSED!")
    print("=" * 40)