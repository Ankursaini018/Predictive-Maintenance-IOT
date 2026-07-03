"""
project_summary.py
==================

Week 4 - Day 3
Commit 1

Final Project Summary Generator

This script provides a consolidated
summary of the Predictive Maintenance
IoT project.

Author : Ankur Saini
Program : Infotact DS/ML Internship
"""

import os
import json
import warnings

warnings.filterwarnings("ignore")

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        ".."
    )
)

DATA_PATH = os.path.join(
    PROJECT_ROOT,
    "data",
    "ai4i2020.csv"
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "src"
)

# ============================================================
# Dataset Loader
# ============================================================

def load_project_dataset():
    """
    Load the fused dataset and
    return useful objects.
    """

    print("=" * 60)
    print("LOADING FUSED DATASET")
    print("=" * 60)

    fused_df = create_fused_dataset(
        DATA_PATH
    )

    X, y, feature_names = get_fused_arrays(
        fused_df
    )

    return X, y, feature_names, fused_df


# ============================================================
# Dataset Summary
# ============================================================

def print_dataset_summary(
    X,
    y,
    feature_names,
    df
):
    """
    Display dataset statistics.
    """

    print("\n" + "=" * 60)
    print("DATASET SUMMARY")
    print("=" * 60)

    print(f"Dataset Shape     : {df.shape}")
    print(f"Samples           : {len(df)}")
    print(f"Features          : {len(feature_names)}")
    print(f"Failure Samples   : {int(y.sum())}")
    print(f"Normal Samples    : {int((y == 0).sum())}")
    print(f"Failure Rate      : {100 * y.mean():.2f}%")

    imbalance = (
        (len(y) - y.sum())
        / max(y.sum(), 1)
    )

    print(f"Imbalance Ratio   : {imbalance:.2f}:1")


# ============================================================
# Feature Summary
# ============================================================

def summarize_features(feature_names):
    """
    Categorize engineered features.
    """

    categories = {

        "Rolling Features": sum(
            "roll" in f.lower()
            for f in feature_names
        ),

        "Lag Features": sum(
            "lag" in f.lower()
            for f in feature_names
        ),

        "ROC Features": sum(
            "roc" in f.lower()
            for f in feature_names
        ),

        "Weather Features": sum(
            any(
                key in f.lower()
                for key in [
                    "weather",
                    "humidity",
                    "ambient",
                    "wind",
                    "pressure"
                ]
            )
            for f in feature_names
        ),

        "Factory Features": sum(
            any(
                key in f.lower()
                for key in [
                    "factory",
                    "shift",
                    "production",
                    "maintenance",
                    "util"
                ]
            )
            for f in feature_names
        ),

        "Other Features": len(feature_names)
    }

    print("\n" + "=" * 60)
    print("FEATURE ENGINEERING SUMMARY")
    print("=" * 60)

    for name, value in categories.items():
        print(f"{name:<25}: {value}")

    return categories

# ============================================================
# Model Evaluation
# ============================================================

from model_evaluator import evaluate_model


def get_model_summary():
    """
    Run the trained model evaluation
    and collect important metrics.
    """

    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    results = evaluate_model(DATA_PATH)

    metrics = {
        "algorithm": "LightGBM",
        "macro_f1": round(float(results["mean_f1"]), 4),
        "macro_f1_std": round(float(results["std_f1"]), 4),
        "roc_auc": round(float(results["mean_auc"]), 4),
        "precision": round(float(results["mean_precision"]), 4),
        "recall": round(float(results["mean_recall"]), 4),
        "target_f1": 0.85,
        "target_achieved": bool(
            results["mean_f1"] >= 0.85
        )
    }

    print(f"Macro F1     : {metrics['macro_f1']:.4f}")
    print(f"ROC AUC      : {metrics['roc_auc']:.4f}")
    print(f"Precision    : {metrics['precision']:.4f}")
    print(f"Recall       : {metrics['recall']:.4f}")

    if metrics["target_achieved"]:
        print("\n✅ Target F1 Achieved")
    else:
        print("\n⚠️ Target F1 Not Achieved")

    return metrics


# ============================================================
# Project Summary
# ============================================================

def generate_project_summary():
    """
    Generate complete project summary.
    """

    print("\n")
    print("=" * 60)
    print("PREDICTIVE MAINTENANCE IoT")
    print("FINAL PROJECT SUMMARY")
    print("=" * 60)

    X, y, feature_names, df = load_project_dataset()

    print_dataset_summary(
        X,
        y,
        feature_names,
        df
    )

    feature_categories = summarize_features(
        feature_names
    )

    model_metrics = get_model_summary()

    summary = {

        "project": "Predictive Maintenance IoT",

        "dataset": {

            "samples": int(len(df)),
            "features": int(len(feature_names)),
            "failure_rate": round(
                float(y.mean() * 100),
                2
            )

        },

        "feature_categories": feature_categories,

        "model": model_metrics

    }

    print("\n" + "=" * 60)
    print("PROJECT SUMMARY CREATED")
    print("=" * 60)

    return summary

# ============================================================
# Save Summary
# ============================================================

def save_summary(summary):
    """
    Save project summary as JSON.
    """

    output_file = os.path.join(
        OUTPUT_DIR,
        "project_summary.json"
    )

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            summary,
            f,
            indent=4
        )

    print("\n✅ Summary saved successfully.")
    print(f"Location : {output_file}")


# ============================================================
# Final Status
# ============================================================

def print_final_status(summary):
    """
    Print final project status.
    """

    print("\n" + "=" * 60)
    print("FINAL PROJECT STATUS")
    print("=" * 60)

    print("Project : Predictive Maintenance IoT")
    print("Internship : Infotact DS/ML Internship")

    print("\nDataset")
    print("-" * 60)

    print(
        f"Samples        : {summary['dataset']['samples']}"
    )

    print(
        f"Features       : {summary['dataset']['features']}"
    )

    print(
        f"Failure Rate   : "
        f"{summary['dataset']['failure_rate']}%"
    )

    print("\nModel")
    print("-" * 60)

    print(
        f"Algorithm      : "
        f"{summary['model']['algorithm']}"
    )

    print(
        f"Macro F1       : "
        f"{summary['model']['macro_f1']}"
    )

    print(
        f"ROC AUC        : "
        f"{summary['model']['roc_auc']}"
    )

    print(
        f"Precision      : "
        f"{summary['model']['precision']}"
    )

    print(
        f"Recall         : "
        f"{summary['model']['recall']}"
    )

    if summary["model"]["target_achieved"]:
        print("\n✅ Target F1 Achieved")
    else:
        print("\n⚠️ Target F1 Not Achieved")

    print("\nProject Progress")
    print("-" * 60)

    print("Week 1 : Complete ✅")
    print("Week 2 : Complete ✅")
    print("Week 3 : Complete ✅")
    print("Week 4 : Complete ✅")

    print("\n🎉 Project Ready For Final Review")

    print("=" * 60)


# ============================================================
# Main
# ============================================================

def main():

    summary = generate_project_summary()

    save_summary(summary)

    print_final_status(summary)

    return summary


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    main()
    