"""
preprocessing.py
================
Week 1 - IoT Telemetry Ingestion & Signal Processing Pipeline
Infotact DS/ML Internship — Project 1: Predictive Maintenance

Author: Solo Worker
Dataset: AI4I 2020 Predictive Maintenance Dataset
"""

import pandas as pd
import numpy as np
from scipy import stats


# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

SENSOR_COLS = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

LAG_COLS = [
    "Torque [Nm]",
    "Tool wear [min]",
    "Rotational speed [rpm]",
    "power"
]

ROC_COLS = [
    "Torque [Nm]",
    "Tool wear [min]",
    "power"
]

COLS_TO_DROP = [
    "UDI", "Product ID", "Type",
    "TWF", "HDF", "PWF", "OSF", "RNF"
]

TARGET_COL = "Machine failure"
WINDOW_SIZE = 10
LAG_STEPS = 3
ZSCORE_THRESHOLD = 3.0


# ─────────────────────────────────────────────
# STEP 1: LOAD DATA
# ─────────────────────────────────────────────

def load_data(filepath: str) -> pd.DataFrame:
    """
    Load dataset from CSV.
    """
    df = pd.read_csv(filepath)
    print(f"[load_data] Loaded {df.shape[0]} rows, {df.shape[1]} cols")
    return df


# ─────────────────────────────────────────────
# STEP 2: ROLLING FEATURES
# ─────────────────────────────────────────────

def add_rolling_features(df: pd.DataFrame,
                         window: int = WINDOW_SIZE) -> pd.DataFrame:
    """
    Add rolling mean, std and variance.
    """
    for col in SENSOR_COLS:
        df[f"{col}_roll_mean"] = df[col].rolling(window=window).mean()
        df[f"{col}_roll_std"] = df[col].rolling(window=window).std()
        df[f"{col}_roll_var"] = df[col].rolling(window=window).var()

    print(f"[add_rolling_features] Added {len(SENSOR_COLS)*3} rolling features")
    return df


# ─────────────────────────────────────────────
# STEP 3: DOMAIN FEATURES
# ─────────────────────────────────────────────

def add_domain_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add domain knowledge features.
    """

    df["temp_delta"] = (
        df["Process temperature [K]"]
        - df["Air temperature [K]"]
    )

    df["power"] = (
        df["Torque [Nm]"]
        * df["Rotational speed [rpm]"]
    )

    df["tool_wear_rate"] = (
        df["Tool wear [min]"]
        / (df["Rotational speed [rpm]"] + 1)
    )

    df["torque_per_rpm"] = (
        df["Torque [Nm]"]
        / (df["Rotational speed [rpm]"] + 1)
    )

    df["temp_wear_interaction"] = (
        df["Process temperature [K]"]
        * df["Tool wear [min]"]
    )

    df["type_encoded"] = df["Type"].map({
        "L": 0,
        "M": 1,
        "H": 2
    })

    print("[add_domain_features] Added 6 domain features")
    return df


# ─────────────────────────────────────────────
# STEP 4: LAG FEATURES
# ─────────────────────────────────────────────

def add_lag_features(df: pd.DataFrame,
                     lag_steps: int = LAG_STEPS) -> pd.DataFrame:
    """
    Add lag features.
    """
    for col in LAG_COLS:
        for lag in range(1, lag_steps + 1):
            df[f"{col}_lag{lag}"] = df[col].shift(lag)

    total = len(LAG_COLS) * lag_steps
    print(f"[add_lag_features] Added {total} lag features")
    return df


# ─────────────────────────────────────────────
# STEP 5: RATE OF CHANGE FEATURES
# ─────────────────────────────────────────────

def add_roc_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add rate-of-change features.
    """
    for col in ROC_COLS:
        df[f"{col}_roc"] = df[col].diff(1)
        df[f"{col}_roc_abs"] = df[col].diff(1).abs()

    print(f"[add_roc_features] Added {len(ROC_COLS)*2} ROC features")
    return df


# ─────────────────────────────────────────────
# STEP 6: OUTLIER FLAGS
# ─────────────────────────────────────────────

def add_outlier_flags(df: pd.DataFrame,
                      threshold: float = ZSCORE_THRESHOLD) -> pd.DataFrame:
    """
    Add outlier flags using z-score.
    """
    for col in SENSOR_COLS:
        z_scores = np.abs(
            stats.zscore(df[col].fillna(df[col].mean()))
        )

        df[f"{col}_outlier_flag"] = (
            z_scores > threshold
        ).astype(int)

    outlier_cols = [
        c for c in df.columns
        if "outlier_flag" in c
    ]

    df["total_anomaly_score"] = (
        df[outlier_cols].sum(axis=1)
    )

    print(
        f"[add_outlier_flags] Added {len(SENSOR_COLS)+1} outlier features"
    )

    return df


# ─────────────────────────────────────────────
# STEP 7: CLEAN DATAFRAME
# ─────────────────────────────────────────────

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Drop unnecessary columns and NaNs.
    """
    df = df.drop(
        columns=COLS_TO_DROP,
        errors="ignore"
    )

    before = len(df)

    df = df.dropna().reset_index(drop=True)

    after = len(df)

    print(f"[clean_dataframe] Dropped {before - after} NaN rows")
    print(f"[clean_dataframe] Final shape: {df.shape}")

    return df


# ─────────────────────────────────────────────
# MASTER PIPELINE
# ─────────────────────────────────────────────

def load_and_preprocess(filepath: str):
    """
    Run complete preprocessing pipeline.
    """
    print("=" * 50)
    print("PREDICTIVE MAINTENANCE PREPROCESSING PIPELINE")
    print("=" * 50)

    df = load_data(filepath)
    df = add_rolling_features(df)
    df = add_domain_features(df)
    df = add_lag_features(df)
    df = add_roc_features(df)
    df = add_outlier_flags(df)
    df = clean_dataframe(df)

    X = df.drop(columns=[TARGET_COL]).values
    y = df[TARGET_COL].values
    feature_names = df.drop(
        columns=[TARGET_COL]
    ).columns.tolist()

    print("=" * 50)
    print(" Pipeline complete!")
    print(f"X shape      : {X.shape}")
    print(f"y shape      : {y.shape}")
    print(f"Features     : {len(feature_names)}")
    print(f"Failure rate : {y.mean()*100:.2f}%")
    print("=" * 50)

    return X, y, feature_names, df


# ─────────────────────────────────────────────
# QUICK TEST
# ─────────────────────────────────────────────

if __name__ == "__main__":
    X, y, feature_names, df = load_and_preprocess(
        "../data/ai4i2020.csv"
    )