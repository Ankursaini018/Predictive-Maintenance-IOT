"""
pr_curve_analyzer.py
====================

Week 4 - Day 2
Commit 1

Precision-Recall Curve Analysis
"""

# ============================================================
# Imports
# ============================================================

import warnings
warnings.filterwarnings("ignore")

import os
import json

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split

from sklearn.metrics import (
    precision_recall_curve,
    average_precision_score,
    f1_score
)

from imblearn.over_sampling import SMOTE

import lightgbm as lgb

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = os.path.abspath(".")

DATA_PATH = os.path.join(
    PROJECT_ROOT,
    "data",
    "ai4i2020.csv"
)

MODEL_DIR = os.path.join(
    PROJECT_ROOT,
    "models"
)

RESULT_DIR = os.path.join(
    PROJECT_ROOT,
    "src",
    "tuning_results"
)

os.makedirs(
    RESULT_DIR,
    exist_ok=True
)

RANDOM_STATE = 42
TEST_SIZE = 0.20

# ============================================================
# Dataset Loader
# ============================================================

def load_dataset():

    print("=" * 60)
    print("LOADING FUSED DATASET")
    print("=" * 60)

    fused_df = create_fused_dataset(
        DATA_PATH
    )

    X, y, feature_names = get_fused_arrays(
        fused_df
    )

    print(f"Dataset Shape : {X.shape}")
    print(f"Features      : {len(feature_names)}")
    print(f"Failure Rate  : {100*y.mean():.2f}%")

    return X, y, feature_names


# ============================================================
# Load Best Parameters
# ============================================================

def load_best_parameters():

    parameter_file = os.path.join(
        RESULT_DIR,
        "optuna_best_parameters.json"
    )

    if os.path.exists(parameter_file):

        print("\nLoading Optuna Parameters...")

        with open(
            parameter_file,
            "r"
        ) as f:

            params = json.load(f)

        print("Parameters Loaded Successfully")

    else:

        print("\nOptuna parameter file not found.")
        print("Using LightGBM default parameters.")

        params = {}

    return params


# ============================================================
# Train/Test Split
# ============================================================

def prepare_data():

    X, y, feature_names = load_dataset()

    X_train, X_test, y_train, y_test = train_test_split(

        X,

        y,

        test_size=TEST_SIZE,

        random_state=RANDOM_STATE,

        stratify=y

    )

    print("\nApplying SMOTE...")

    smote = SMOTE(
        random_state=RANDOM_STATE
    )

    X_train, y_train = smote.fit_resample(

        X_train,

        y_train

    )

    print(f"Train Shape : {X_train.shape}")
    print(f"Test Shape  : {X_test.shape}")

    return (

        X_train,

        X_test,

        y_train,

        y_test,

        feature_names

    )
# ============================================================
# Train LightGBM Model
# ============================================================

def train_model():

    (
        X_train,
        X_test,
        y_train,
        y_test,
        feature_names
    ) = prepare_data()

    params = load_best_parameters()

    # Remove duplicate parameters if present
    for key in [
        "objective",
        "metric",
        "boosting_type",
        "random_state",
        "class_weight",
        "verbosity"
    ]:
        params.pop(key, None)

    print("\n" + "=" * 60)
    print("TRAINING LIGHTGBM MODEL")
    print("=" * 60)

    model = lgb.LGBMClassifier(

        objective="binary",

        metric="binary_logloss",

        boosting_type="gbdt",

        random_state=RANDOM_STATE,

        class_weight="balanced",

        verbosity=-1,

        **params

    )

    model.fit(

        X_train,

        y_train

    )

    print("Model Trained Successfully.")

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions = model.predict(
        X_test
    )

    macro_f1 = f1_score(

        y_test,

        predictions,

        average="macro",

        zero_division=0

    )

    print(f"\nMacro F1 Score : {macro_f1:.4f}")

    return (

        model,

        X_test,

        y_test,

        probabilities,

        feature_names

    )
# ============================================================
# Save Threshold Summary
# ============================================================

def save_threshold_summary(

    ap_score,

    best_threshold,

    best_f1

):

    summary_file = os.path.join(

        RESULT_DIR,

        "threshold_summary.txt"

    )

    with open(summary_file, "w") as f:

        f.write("=" * 60 + "\n")
        f.write("PRECISION-RECALL SUMMARY\n")
        f.write("=" * 60 + "\n\n")

        f.write(f"Average Precision : {ap_score:.6f}\n")
        f.write(f"Best Threshold    : {best_threshold:.6f}\n")
        f.write(f"Best F1 Score     : {best_f1:.6f}\n")

    print(f"\nSummary saved to:\n{summary_file}")
    # ============================================================
# Plot Precision-Recall Curve
# ============================================================

def plot_pr_curve(

    precision,

    recall,

    ap_score,

    best_threshold,

    best_f1

):

    plt.figure(figsize=(10, 7))

    plt.plot(

        recall,

        precision,

        color="blue",

        linewidth=2.5,

        label=f"AP = {ap_score:.4f}"

    )

    plt.scatter(

        recall[np.argmax(precision[:-1] * recall[:-1])],

        precision[np.argmax(precision[:-1] * recall[:-1])],

        color="red",

        s=100,

        label=f"Best Threshold = {best_threshold:.3f}"

    )

    plt.xlabel("Recall")

    plt.ylabel("Precision")

    plt.title("Precision-Recall Curve")

    plt.grid(True)

    plt.legend()

    plt.tight_layout()

    output_path = os.path.join(

        RESULT_DIR,

        "precision_recall_curve.png"

    )

    plt.savefig(

        output_path,

        dpi=300,

        bbox_inches="tight"

    )

    plt.show()

    print(f"\nPrecision-Recall Curve saved to:\n{output_path}")
# ============================================================
# Precision-Recall Analysis
# ============================================================

def analyze_pr_curve(y_true, probabilities):

    precision, recall, thresholds = precision_recall_curve(
        y_true,
        probabilities
    )

    ap_score = average_precision_score(
        y_true,
        probabilities
    )

    f1_scores = []

    for p, r in zip(precision[:-1], recall[:-1]):

        if (p + r) == 0:
            f1_scores.append(0)

        else:
            f1_scores.append(
                2 * p * r / (p + r)
            )

    f1_scores = np.array(f1_scores)

    best_index = np.argmax(f1_scores)

    best_threshold = thresholds[best_index]

    best_f1 = f1_scores[best_index]

    print("\n" + "=" * 60)
    print("PRECISION-RECALL ANALYSIS")
    print("=" * 60)

    print(f"Average Precision : {ap_score:.4f}")
    print(f"Best Threshold    : {best_threshold:.4f}")
    print(f"Best F1 Score     : {best_f1:.4f}")

    return (
        precision,
        recall,
        thresholds,
        ap_score,
        best_threshold,
        best_f1
    )


# ============================================================
# Main Pipeline
# ============================================================

def main():

    print("=" * 70)
    print("WEEK 4 - DAY 2")
    print("PRECISION-RECALL CURVE ANALYSIS")
    print("=" * 70)

    (
        model,
        X_test,
        y_test,
        probabilities,
        feature_names
    ) = train_model()

    (
        precision,
        recall,
        thresholds,
        ap_score,
        best_threshold,
        best_f1
    ) = analyze_pr_curve(
        y_test,
        probabilities
    )

    plot_pr_curve(
        precision,
        recall,
        ap_score,
        best_threshold,
        best_f1
    )

    save_threshold_summary(
        ap_score,
        best_threshold,
        best_f1
    )

    print("\n" + "=" * 70)
    print("PRECISION-RECALL ANALYSIS COMPLETED")
    print("=" * 70)

    print("\nGenerated Files")

    print(
        os.path.join(
            RESULT_DIR,
            "precision_recall_curve.png"
        )
    )

    print(
        os.path.join(
            RESULT_DIR,
            "threshold_summary.txt"
        )
    )

    return {
        "model": model,
        "feature_names": feature_names,
        "X_test": X_test,
        "y_test": y_test,
        "probabilities": probabilities,
        "precision": precision,
        "recall": recall,
        "thresholds": thresholds,
        "average_precision": ap_score,
        "best_threshold": best_threshold,
        "best_f1": best_f1
    }


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    results = main()