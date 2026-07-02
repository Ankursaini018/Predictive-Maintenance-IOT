"""
threshold_optimizer.py
======================

Week 4 - Day 2
Commit 2

Threshold Optimization
"""
import warnings
warnings.filterwarnings("ignore")

import os
import json
import joblib

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split

from sklearn.metrics import (

    precision_score,
    recall_score,
    f1_score,
    accuracy_score

)

import lightgbm as lgb

from imblearn.over_sampling import SMOTE

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

TEST_SIZE = 0.20
RANDOM_STATE = 42
# ============================================================
# Load Dataset
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
    print(f"Failure Rate  : {100 * y.mean():.2f}%")

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

        with open(parameter_file, "r") as f:
            params = json.load(f)

        print("Parameters Loaded Successfully")

    else:

        print("\nOptuna parameter file not found.")
        print("Using default LightGBM parameters.")

        params = {}

    return params
# ============================================================
# Train Model
# ============================================================

def train_model():

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

    params = load_best_parameters()

    params.pop("objective", None)
    params.pop("metric", None)
    params.pop("boosting_type", None)
    params.pop("random_state", None)
    params.pop("class_weight", None)
    params.pop("verbosity", None)

    model = lgb.LGBMClassifier(

        objective="binary",

        metric="binary_logloss",

        boosting_type="gbdt",

        random_state=RANDOM_STATE,

        class_weight="balanced",

        verbosity=-1,

        **params

    )

    print("\n" + "=" * 60)
    print("TRAINING LIGHTGBM MODEL")
    print("=" * 60)

    model.fit(

        X_train,

        y_train

    )

    print("\nModel Trained Successfully.")

    probabilities = model.predict_proba(

        X_test

    )[:, 1]

    return (

        model,

        X_test,

        y_test,

        probabilities,

        feature_names

    )
# ============================================================
# Evaluate Thresholds
# ============================================================

def evaluate_thresholds(

    y_true,

    probabilities

):

    print("\n" + "=" * 60)
    print("THRESHOLD OPTIMIZATION")
    print("=" * 60)

    thresholds = np.arange(

        0.05,

        1.00,

        0.05

    )

    results = []

    for threshold in thresholds:

        predictions = (

            probabilities >= threshold

        ).astype(int)

        precision = precision_score(

            y_true,

            predictions,

            zero_division=0

        )

        recall = recall_score(

            y_true,

            predictions,

            zero_division=0

        )

        f1 = f1_score(

            y_true,

            predictions,

            zero_division=0

        )

        accuracy = accuracy_score(

            y_true,

            predictions

        )

        results.append({

            "Threshold": threshold,

            "Precision": precision,

            "Recall": recall,

            "F1 Score": f1,

            "Accuracy": accuracy

        })

    results = pd.DataFrame(

        results

    )

    best_index = results["F1 Score"].idxmax()

    best_row = results.iloc[

        best_index

    ]

    print(f"\nBest Threshold : {best_row['Threshold']:.2f}")

    print(f"Best F1 Score  : {best_row['F1 Score']:.4f}")

    return (

        results,

        best_row

    )
# ============================================================
# Plot Threshold Metrics
# ============================================================

def plot_threshold_metrics(results):

    plt.figure(figsize=(12, 7))

    plt.plot(
        results["Threshold"],
        results["Precision"],
        label="Precision",
        linewidth=2
    )

    plt.plot(
        results["Threshold"],
        results["Recall"],
        label="Recall",
        linewidth=2
    )

    plt.plot(
        results["Threshold"],
        results["F1 Score"],
        label="F1 Score",
        linewidth=2
    )

    plt.plot(
        results["Threshold"],
        results["Accuracy"],
        label="Accuracy",
        linewidth=2
    )

    plt.xlabel("Threshold")

    plt.ylabel("Score")

    plt.title("Threshold Optimization")

    plt.grid(True)

    plt.legend()

    plt.tight_layout()

    save_path = os.path.join(
        RESULT_DIR,
        "threshold_metrics.png"
    )

    plt.savefig(
        save_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.show()

    print(f"\nThreshold plot saved to:\n{save_path}")

# ============================================================
# Save Results
# ============================================================

def save_threshold_report(

    results,

    best_row

):

    csv_path = os.path.join(

        RESULT_DIR,

        "threshold_results.csv"

    )

    txt_path = os.path.join(

        RESULT_DIR,

        "best_threshold_report.txt"

    )

    results.to_csv(

        csv_path,

        index=False

    )

    with open(

        txt_path,

        "w"

    ) as f:

        f.write("=" * 60 + "\n")

        f.write("THRESHOLD OPTIMIZATION REPORT\n")

        f.write("=" * 60 + "\n\n")

        f.write(f"Best Threshold : {best_row['Threshold']:.2f}\n")

        f.write(f"Precision      : {best_row['Precision']:.4f}\n")

        f.write(f"Recall         : {best_row['Recall']:.4f}\n")

        f.write(f"F1 Score       : {best_row['F1 Score']:.4f}\n")

        f.write(f"Accuracy       : {best_row['Accuracy']:.4f}\n")

    print(f"\nCSV saved to:\n{csv_path}")

    print(f"\nSummary saved to:\n{txt_path}")

    # ============================================================
# Main Pipeline
# ============================================================

def main():
    print("MAIN FUNCTION STARTED")
    (
        model,
        X_test,
        y_test,
        probabilities,
        feature_names
    ) = train_model()

    (
        results,
        best_row
    ) = evaluate_thresholds(

        y_test,

        probabilities

    )

    plot_threshold_metrics(

        results

    )

    save_threshold_report(

        results,

        best_row

    )

    print("\n" + "=" * 70)

    print("THRESHOLD OPTIMIZATION COMPLETED")

    print("=" * 70)

    print("\nGenerated Files:")

    print(

        os.path.join(

            RESULT_DIR,

            "threshold_metrics.png"

        )

    )

    print(

        os.path.join(

            RESULT_DIR,

            "threshold_results.csv"

        )

    )

    print(

        os.path.join(

            RESULT_DIR,

            "best_threshold_report.txt"

        )

    )

    return {

        "model": model,

        "results": results,

        "best_threshold": best_row

    }
# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    main()