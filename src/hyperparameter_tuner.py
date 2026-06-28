"""
=========================================================
hyperparameter_tuner.py
=========================================================

Project:
Predictive Maintenance using LightGBM + SMOTE

Week 3 - Day 2
Commit 1

Description
-----------
Focused Grid Search for LightGBM hyperparameter tuning.

Pipeline:
    Dataset
        ↓
    Stratified 5 Fold
        ↓
    SMOTE (Training Fold Only)
        ↓
    LightGBM
        ↓
    Macro F1 Evaluation
        ↓
    Best Hyperparameters
=========================================================
"""

import os
import sys
import warnings
warnings.filterwarnings("ignore")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score

from imblearn.over_sampling import SMOTE

import lightgbm as lgb

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

# =========================================================
# BASE CONFIGURATION
# =========================================================

BASE_CONFIG = {

    "objective": "binary",

    "boosting_type": "gbdt",

    "metric": "binary_logloss",

    "class_weight": "balanced",

    "feature_fraction": 0.9,

    "bagging_fraction": 0.8,

    "bagging_freq": 5,

    "random_state": 42,

    "verbosity": -1

}

# =========================================================
# CONFIGURATIONS TO TEST
# =========================================================

TEST_CONFIGS = [

    {
        "num_leaves": 31,
        "learning_rate": 0.05,
        "n_estimators": 300,
        "min_child_samples": 20
    },

    {
        "num_leaves": 63,
        "learning_rate": 0.05,
        "n_estimators": 300,
        "min_child_samples": 20
    },

    {
        "num_leaves": 31,
        "learning_rate": 0.01,
        "n_estimators": 500,
        "min_child_samples": 20
    },

    {
        "num_leaves": 63,
        "learning_rate": 0.10,
        "n_estimators": 200,
        "min_child_samples": 10
    },

    {
        "num_leaves": 15,
        "learning_rate": 0.05,
        "n_estimators": 300,
        "min_child_samples": 30
    },

    {
        "num_leaves": 63,
        "learning_rate": 0.01,
        "n_estimators": 500,
        "min_child_samples": 10
    }

]

# =========================================================
# EVALUATE ONE CONFIGURATION
# =========================================================

def evaluate_configuration(X, y, params):

    skf = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    smote = SMOTE(
        random_state=42,
        k_neighbors=5
    )

    fold_scores = []

    print("-" * 60)

    for fold, (train_idx, test_idx) in enumerate(skf.split(X, y), start=1):

        X_train = X[train_idx]
        X_test = X[test_idx]

        y_train = y[train_idx]
        y_test = y[test_idx]

        # Apply SMOTE only on training fold
        X_train, y_train = smote.fit_resample(
            X_train,
            y_train
        )

        model = lgb.LGBMClassifier(**params)

        model.fit(
            X_train,
            y_train
        )

        predictions = model.predict(X_test)

        score = f1_score(
            y_test,
            predictions,
            average="macro",
            zero_division=0
        )

        fold_scores.append(score)

        print(
            f"Fold {fold} Macro F1 : {score:.4f}"
        )

    mean_score = np.mean(fold_scores)

    print("-" * 60)
    print(f"Average Macro F1 : {mean_score:.4f}")
    print("-" * 60)

    return mean_score
# =========================================================
# FOCUSED GRID SEARCH
# =========================================================

def focused_grid_search(X, y):

    print("\n" + "=" * 65)
    print("        LIGHTGBM HYPERPARAMETER TUNING")
    print("=" * 65)

    best_score = -1
    best_params = None

    results = []

    total_configs = len(TEST_CONFIGS)

    for config_no, config in enumerate(TEST_CONFIGS, start=1):

        print("\n")
        print("=" * 65)
        print(f"Configuration {config_no} of {total_configs}")
        print("=" * 65)

        params = BASE_CONFIG.copy()
        params.update(config)

        print("\nParameters")

        for key, value in config.items():
            print(f"{key:<25}: {value}")

        print()

        score = evaluate_configuration(
            X,
            y,
            params
        )

        results.append({

            "Configuration": config_no,

            "num_leaves": config["num_leaves"],

            "learning_rate": config["learning_rate"],

            "n_estimators": config["n_estimators"],

            "min_child_samples": config["min_child_samples"],

            "Macro F1": round(score, 4)

        })

        if score > best_score:

            best_score = score

            best_params = params.copy()

            print("\n🏆 New Best Configuration Found!")

            print(f"Macro F1 : {best_score:.4f}")

    results_df = pd.DataFrame(results)

    results_df = results_df.sort_values(

        by="Macro F1",

        ascending=False

    ).reset_index(drop=True)

    print("\n")
    print("=" * 65)
    print("GRID SEARCH RESULTS")
    print("=" * 65)

    print(results_df.to_string(index=False))

    print("\n")
    print("=" * 65)
    print(f"BEST MACRO F1 : {best_score:.4f}")
    print("=" * 65)

    print("\nBest Parameters\n")

    for key, value in best_params.items():

        print(f"{key:<25}: {value}")

    return best_params, results_df


# =========================================================
# SAVE RESULTS
# =========================================================

def save_results(best_params, results_df):

    output_dir = os.path.join(CURRENT_DIR, "tuning_results")

    os.makedirs(output_dir, exist_ok=True)

    csv_path = os.path.join(

        output_dir,

        "grid_search_results.csv"

    )

    json_path = os.path.join(

        output_dir,

        "best_parameters.json"

    )

    results_df.to_csv(

        csv_path,

        index=False

    )

    import json

    with open(json_path, "w") as f:

        json.dump(

            best_params,

            f,

            indent=4

        )

    print("\n")
    print("=" * 65)
    print("Results Saved Successfully")
    print("=" * 65)

    print(f"CSV  : {csv_path}")
    print(f"JSON : {json_path}")
    # =========================================================
# MAIN FUNCTION
# =========================================================

def main():

    print("\n" + "=" * 65)
    print("        LIGHTGBM HYPERPARAMETER TUNING")
    print("=" * 65)

    # -----------------------------------------------------
    # Load Dataset
    # -----------------------------------------------------

    print("\nLoading fused dataset...")

    try:

        fused_df = create_fused_dataset(
            "data/ai4i2020.csv"
        )

    except FileNotFoundError:

        print("\nDataset not found!")
        print("Expected path : data/ai4i2020.csv")
        return

    X, y, feature_names = get_fused_arrays(
        fused_df
    )

    print(f"\nDataset Shape : {X.shape}")
    print(f"Features      : {len(feature_names)}")
    print(f"Samples       : {len(y)}")
    print(f"Failure Rate  : {100 * y.mean():.2f}%")

    # -----------------------------------------------------
    # Run Grid Search
    # -----------------------------------------------------

    best_params, results_df = focused_grid_search(
        X,
        y
    )

    # -----------------------------------------------------
    # Save Results
    # -----------------------------------------------------

    save_results(
        best_params,
        results_df
    )

    # -----------------------------------------------------
    # Final Summary
    # -----------------------------------------------------

    print("\n" + "=" * 65)
    print("FINAL BEST PARAMETERS")
    print("=" * 65)

    for key, value in best_params.items():

        print(f"{key:<25}: {value}")

    print("\nBest Macro F1 :")

    print(
        results_df.iloc[0]["Macro F1"]
    )

    print("\nTop 3 Configurations\n")

    print(
        results_df.head(3).to_string(index=False)
    )

    print("\n" + "=" * 65)
    print("Hyperparameter Tuning Completed Successfully")
    print("=" * 65)


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":

    main()
    