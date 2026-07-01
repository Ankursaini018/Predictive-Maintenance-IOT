"""
=========================================================
robustness_tester.py
=========================================================

Project:
Predictive Maintenance using LightGBM

Week 4 - Day 1
Commit 2

Description
-----------
Evaluate the robustness of the final
LightGBM model under synthetic noise.

This module uses:

✔ Final tuned parameters
✔ SMOTE
✔ Noise Injection
✔ Macro F1 degradation
=========================================================
"""

import os
import sys
import json
import warnings

warnings.filterwarnings("ignore")

# ------------------------------------------------------
# Project Paths
# ------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ------------------------------------------------------
# Libraries
# ------------------------------------------------------

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import lightgbm as lgb

from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score

from imblearn.over_sampling import SMOTE

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

from noise_injector import apply_noise

# ------------------------------------------------------
# Paths
# ------------------------------------------------------

RESULT_DIR = os.path.join(
    CURRENT_DIR,
    "tuning_results"
)

# ------------------------------------------------------
# Load Best Parameters
# ------------------------------------------------------

def load_best_parameters():

    config_path = os.path.join(
        RESULT_DIR,
        "optuna_best_parameters.json"
    )

    with open(config_path, "r") as f:

        params = json.load(f)

    return params


# ------------------------------------------------------
# Load Dataset
# ------------------------------------------------------

def load_dataset():

    print("=" * 60)
    print("Loading Dataset")
    print("=" * 60)

    fused_df = create_fused_dataset(
        os.path.join(
            PROJECT_ROOT,
            "data",
            "ai4i2020.csv"
        )
    )

    X, y, feature_names = get_fused_arrays(
        fused_df
    )

    return X, y, feature_names


# ------------------------------------------------------
# Train Clean Model
# ------------------------------------------------------

def train_clean_model():

    X, y, feature_names = load_dataset()

    params = load_best_parameters()

    X_train, X_test, y_train, y_test = train_test_split(

        X,

        y,

        test_size=0.20,

        random_state=42,

        stratify=y

    )

    smote = SMOTE(random_state=42)

    X_train, y_train = smote.fit_resample(
        X_train,
        y_train
    )

    params.update({

    "objective": "binary",

    "metric": "binary_logloss",

    "boosting_type": "gbdt",

    "class_weight": "balanced",

    "random_state": 42,

    "verbosity": -1

})

    model = lgb.LGBMClassifier(**params)

    model.fit(
        X_train,
        y_train
    )

    baseline_pred = model.predict(X_test)

    baseline_f1 = f1_score(

        y_test,

        baseline_pred,

        average="macro",

        zero_division=0

    )

    print(f"\nBaseline Macro F1 : {baseline_f1:.4f}")

    return (
        model,
        X_test,
        y_test,
        feature_names,
        baseline_f1
    )
# ------------------------------------------------------
# Noise Robustness Testing
# ------------------------------------------------------

def test_noise_robustness(
    model,
    X_test,
    y_test,
    noise_levels=None
):

    if noise_levels is None:

        noise_levels = [
            0.05,
            0.10,
            0.20,
            0.30,
            0.40,
            0.50
        ]

    noise_types = [

        "gaussian",

        "missing",

        "drift",

        "spike",

        "scaling"

    ]

    print("\n" + "=" * 60)
    print("ROBUSTNESS TESTING")
    print("=" * 60)

    results = []

    # -------------------------------
    # Baseline
    # -------------------------------

    baseline_pred = model.predict(X_test)

    baseline_f1 = f1_score(

        y_test,

        baseline_pred,

        average="macro",

        zero_division=0

    )

    results.append({

        "noise_type": "clean",

        "noise_level": 0.0,

        "macro_f1": baseline_f1,

        "performance_drop": 0.0

    })

    print(f"\nBaseline F1 : {baseline_f1:.4f}")

    # -------------------------------
    # Test Every Noise Type
    # -------------------------------

    for noise in noise_types:

        print(f"\nTesting {noise} noise")

        for level in noise_levels:

            X_noisy = apply_noise(

                X_test,

                noise_type=noise,

                noise_level=level

            )

            predictions = model.predict(

                X_noisy

            )

            score = f1_score(

                y_test,

                predictions,

                average="macro",

                zero_division=0

            )

            drop = baseline_f1 - score

            print(

                f"Level {level:.2f}"

                f" -> F1={score:.4f}"

                f" | Drop={drop:.4f}"

            )

            results.append({

                "noise_type": noise,

                "noise_level": level,

                "macro_f1": score,

                "performance_drop": drop

            })

    results_df = pd.DataFrame(results)

    return results_df, baseline_f1


# ------------------------------------------------------
# Robustness Summary
# ------------------------------------------------------

def summarize_results(
    results_df,
    baseline_f1
):

    print("\n" + "=" * 60)
    print("ROBUSTNESS SUMMARY")
    print("=" * 60)

    print(f"Baseline F1 : {baseline_f1:.4f}\n")

    summary = (

        results_df[
            results_df["noise_type"] != "clean"
        ]

        .groupby("noise_type")

        .agg(

            Mean_F1=("macro_f1", "mean"),

            Minimum_F1=("macro_f1", "min"),

            Maximum_Drop=("performance_drop", "max")

        )

        .sort_values(

            by="Mean_F1",

            ascending=False

        )

    )

    print(summary)

    return summary
# ------------------------------------------------------
# Plot Robustness Curves
# ------------------------------------------------------

def plot_robustness_curves(
    results_df,
    baseline_f1
):

    print("\nGenerating Robustness Plots...")

    plt.figure(figsize=(12, 7))

    noise_types = [
        "gaussian",
        "missing",
        "drift",
        "spike",
        "scaling"
    ]

    for noise in noise_types:

        subset = results_df[
            results_df["noise_type"] == noise
        ]

        plt.plot(
            subset["noise_level"],
            subset["macro_f1"],
            marker="o",
            linewidth=2,
            label=noise.capitalize()
        )

    plt.axhline(
        baseline_f1,
        linestyle="--",
        linewidth=2,
        label=f"Baseline ({baseline_f1:.4f})"
    )

    plt.xlabel("Noise Level")
    plt.ylabel("Macro F1 Score")
    plt.title("Model Robustness Under Synthetic Noise")
    plt.grid(True)
    plt.legend()

    os.makedirs(RESULT_DIR, exist_ok=True)

    figure_path = os.path.join(
        RESULT_DIR,
        "robustness_curves.png"
    )

    plt.tight_layout()

    plt.savefig(
        figure_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.show()

    print(f"\nSaved: {figure_path}")


# ------------------------------------------------------
# Save Results
# ------------------------------------------------------

def save_results(
    results_df,
    summary_df
):

    csv_path = os.path.join(
        RESULT_DIR,
        "robustness_results.csv"
    )

    summary_path = os.path.join(
        RESULT_DIR,
        "robustness_summary.csv"
    )

    results_df.to_csv(
        csv_path,
        index=False
    )

    summary_df.to_csv(
        summary_path
    )

    print("\nResults saved successfully.")

    print(csv_path)

    print(summary_path)


# ------------------------------------------------------
# Main
# ------------------------------------------------------

def main():

    print("=" * 70)
    print("NOISE ROBUSTNESS ANALYSIS")
    print("=" * 70)

    (
        model,
        X_test,
        y_test,
        feature_names,
        baseline_f1
    ) = train_clean_model()

    results_df, baseline = test_noise_robustness(
        model,
        X_test,
        y_test
    )

    summary_df = summarize_results(
        results_df,
        baseline
    )

    plot_robustness_curves(
        results_df,
        baseline
    )

    save_results(
        results_df,
        summary_df
    )

    print("\n" + "=" * 70)
    print("ROBUSTNESS ANALYSIS COMPLETED SUCCESSFULLY")
    print("=" * 70)

    print("\nGenerated Files")

    print(
        os.path.join(
            RESULT_DIR,
            "robustness_curves.png"
        )
    )

    print(
        os.path.join(
            RESULT_DIR,
            "robustness_results.csv"
        )
    )

    print(
        os.path.join(
            RESULT_DIR,
            "robustness_summary.csv"
        )
    )


# ------------------------------------------------------
# Entry Point
# ------------------------------------------------------

if __name__ == "__main__":

    main()
