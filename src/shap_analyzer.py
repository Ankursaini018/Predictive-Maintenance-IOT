"""
=========================================================
shap_analyzer.py
=========================================================

Project:
Predictive Maintenance using LightGBM

Week 3 - Day 3
Commit 1

Description
-----------
SHAP (SHapley Additive exPlanations)
for interpreting the final tuned
LightGBM model.

This implementation uses the tuned
Optuna hyperparameters and the
existing data fusion pipeline.
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

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score
from imblearn.over_sampling import SMOTE

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

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

    print(f"Dataset Shape : {X.shape}")
    print(f"Features      : {len(feature_names)}")

    return X, y, feature_names

# ------------------------------------------------------
# Train Model for SHAP
# ------------------------------------------------------

def train_model_for_shap():

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

    model = lgb.LGBMClassifier(

        objective="binary",

        boosting_type="gbdt",

        metric="binary_logloss",

        class_weight="balanced",

        random_state=42,

        verbosity=-1,

        num_leaves=params["num_leaves"],

        learning_rate=params["learning_rate"],

        n_estimators=params["n_estimators"],

        min_child_samples=params["min_child_samples"],

        feature_fraction=params["feature_fraction"],

        bagging_fraction=params["bagging_fraction"],

        reg_alpha=params["reg_alpha"],

        reg_lambda=params["reg_lambda"]

    )

    model.fit(
        X_train,
        y_train
    )

    predictions = model.predict(
        X_test
    )

    score = f1_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0
    )

    print(f"\nModel Macro F1 : {score:.4f}")

    return model, X_test, y_test, feature_names
# ------------------------------------------------------
# Compute SHAP Values
# ------------------------------------------------------

def compute_shap_values(model, X_test):

    if not SHAP_AVAILABLE:
        raise ImportError(
            "SHAP is not installed. Run: pip install shap"
        )

    print("\n" + "=" * 60)
    print("Computing SHAP Values")
    print("=" * 60)

    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(X_test)

    print("SHAP computation completed successfully.")

    return explainer, shap_values


# ------------------------------------------------------
# SHAP Summary Plot
# ------------------------------------------------------

def generate_summary_plot(
    shap_values,
    X_test,
    feature_names
):

    print("\nGenerating SHAP Summary Plot...")

    plt.figure(figsize=(12, 8))

    values = shap_values

    # Compatibility for binary classifiers
    if isinstance(shap_values, list):
        values = shap_values[1]

    shap.summary_plot(
        values,
        X_test,
        feature_names=feature_names,
        show=False
    )

    output_path = os.path.join(
        RESULT_DIR,
        "shap_summary_plot.png"
    )

    plt.tight_layout()

    plt.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Saved: {output_path}")


# ------------------------------------------------------
# SHAP Feature Importance Bar Plot
# ------------------------------------------------------

def generate_bar_plot(
    shap_values,
    X_test,
    feature_names
):

    print("\nGenerating SHAP Feature Importance Plot...")

    plt.figure(figsize=(10, 8))

    values = shap_values

    if isinstance(shap_values, list):
        values = shap_values[1]

    shap.summary_plot(
        values,
        X_test,
        feature_names=feature_names,
        plot_type="bar",
        show=False
    )

    output_path = os.path.join(
        RESULT_DIR,
        "shap_feature_importance.png"
    )

    plt.tight_layout()

    plt.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Saved: {output_path}")


# ------------------------------------------------------
# Top 20 Important Features
# ------------------------------------------------------

def show_top_features(
    shap_values,
    feature_names
):

    values = shap_values

    if isinstance(shap_values, list):
        values = shap_values[1]

    importance = np.abs(values).mean(axis=0)

    feature_df = pd.DataFrame({

        "Feature": feature_names,

        "Mean SHAP": importance

    })

    feature_df = feature_df.sort_values(

        by="Mean SHAP",

        ascending=False

    )

    print("\n" + "=" * 60)
    print("Top 20 Important Features")
    print("=" * 60)

    print(feature_df.head(20))

    csv_path = os.path.join(

        RESULT_DIR,

        "shap_feature_ranking.csv"

    )

    feature_df.to_csv(

        csv_path,

        index=False

    )

    print(f"\nSaved: {csv_path}")

    return feature_df
# ------------------------------------------------------
# SHAP Waterfall Plot
# ------------------------------------------------------

def generate_waterfall_plot(
    explainer,
    shap_values,
    X_test,
    feature_names,
    sample_index=0
):

    print("\nGenerating SHAP Waterfall Plot...")

    values = shap_values

    if isinstance(shap_values, list):
        values = shap_values[1]

    explanation = shap.Explanation(
        values=values[sample_index],
        base_values=explainer.expected_value if not isinstance(explainer.expected_value, list)
        else explainer.expected_value[1],
        data=X_test[sample_index],
        feature_names=feature_names
    )

    plt.figure(figsize=(12,8))

    shap.plots.waterfall(
        explanation,
        show=False
    )

    output_path = os.path.join(
        RESULT_DIR,
        "shap_waterfall_plot.png"
    )

    plt.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Saved: {output_path}")


# ------------------------------------------------------
# Save SHAP Summary Report
# ------------------------------------------------------

def save_shap_report(feature_df):

    report_path = os.path.join(
        RESULT_DIR,
        "shap_analysis_report.txt"
    )

    with open(report_path, "w") as f:

        f.write("="*60 + "\n")
        f.write("SHAP FEATURE IMPORTANCE REPORT\n")
        f.write("="*60 + "\n\n")

        f.write("Top 20 Important Features\n")
        f.write("-"*40 + "\n\n")

        f.write(
            feature_df.head(20).to_string(index=False)
        )

    print(f"\nSaved: {report_path}")


# ------------------------------------------------------
# Main
# ------------------------------------------------------

def main():

    print("="*70)
    print("SHAP FEATURE IMPORTANCE ANALYSIS")
    print("="*70)

    model, X_test, y_test, feature_names = train_model_for_shap()

    explainer, shap_values = compute_shap_values(
        model,
        X_test
    )

    generate_summary_plot(
        shap_values,
        X_test,
        feature_names
    )

    generate_bar_plot(
        shap_values,
        X_test,
        feature_names
    )

    feature_df = show_top_features(
        shap_values,
        feature_names
    )

    generate_waterfall_plot(
        explainer,
        shap_values,
        X_test,
        feature_names
    )

    save_shap_report(
        feature_df
    )

    print("\n" + "="*70)
    print("SHAP ANALYSIS COMPLETED SUCCESSFULLY")
    print("="*70)

    print("\nGenerated Files:")

    print(f"✔ {os.path.join(RESULT_DIR,'shap_summary_plot.png')}")
    print(f"✔ {os.path.join(RESULT_DIR,'shap_feature_importance.png')}")
    print(f"✔ {os.path.join(RESULT_DIR,'shap_waterfall_plot.png')}")
    print(f"✔ {os.path.join(RESULT_DIR,'shap_feature_ranking.csv')}")
    print(f"✔ {os.path.join(RESULT_DIR,'shap_analysis_report.txt')}")


# ------------------------------------------------------
# Entry Point
# ------------------------------------------------------

if __name__ == "__main__":

    if not SHAP_AVAILABLE:

        print("\nSHAP is not installed.")

        print("Install using:")

        print("pip install shap")

    else:

        main()
        