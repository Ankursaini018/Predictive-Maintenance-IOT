"""
=========================================================
final_model_pipeline.py
=========================================================

Project:
Predictive Maintenance using LightGBM

Week 3 - Day 4
Commit 1

Description
-----------
Final production pipeline combining:

✔ Data Fusion
✔ Optuna Best Parameters
✔ SMOTE
✔ Stratified 5-Fold CV
✔ Final Evaluation

This script serves as the central pipeline
for the remaining Week 3 tasks.
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

import lightgbm as lgb

from collections import Counter

from sklearn.model_selection import StratifiedKFold

from sklearn.metrics import (

    f1_score,

    roc_auc_score,

    precision_score,

    recall_score,

    confusion_matrix,

    classification_report

)

from imblearn.over_sampling import SMOTE

from external_data.data_fusion import (

    create_fused_dataset,

    get_fused_arrays

)

# ------------------------------------------------------
# Configuration
# ------------------------------------------------------

CV_CONFIG = {

    "n_splits":5,

    "shuffle":True,

    "random_state":42

}

SMOTE_CONFIG = {

    "random_state":42,

    "k_neighbors":5,

    "sampling_strategy":"minority"

}

RESULT_DIR = os.path.join(

    CURRENT_DIR,

    "tuning_results"

)

# ------------------------------------------------------
# Load Tuned Parameters
# ------------------------------------------------------

def load_best_parameters():

    config_path = os.path.join(

        RESULT_DIR,

        "optuna_best_parameters.json"

    )

    if not os.path.exists(config_path):

        raise FileNotFoundError(

            "Run optuna_tuner.py first."

        )

    with open(config_path,"r") as f:

        params = json.load(f)

    print("="*60)
    print("Best Hyperparameters")
    print("="*60)

    for key,value in params.items():

        print(f"{key:<25}: {value}")

    return params


# ------------------------------------------------------
# Load Dataset
# ------------------------------------------------------

def load_dataset():

    print("\n"+"="*60)

    print("Loading Fused Dataset")

    print("="*60)

    fused_df = create_fused_dataset(

        os.path.join(

            PROJECT_ROOT,

            "data",

            "ai4i2020.csv"

        )

    )

    X,y,feature_names = get_fused_arrays(

        fused_df

    )

    print(f"\nDataset Shape : {X.shape}")

    print(f"Features      : {len(feature_names)}")

    print(f"Failure Rate  : {100*y.mean():.2f}%")

    print(f"Class Balance : {Counter(y)}")

    return X,y,feature_names


# ------------------------------------------------------
# Build Final Model
# ------------------------------------------------------

def create_final_model(best_params):

    model = lgb.LGBMClassifier(

        objective="binary",

        boosting_type="gbdt",

        metric="binary_logloss",

        class_weight="balanced",

        random_state=42,

        verbosity=-1,

        num_leaves=best_params["num_leaves"],

        learning_rate=best_params["learning_rate"],

        n_estimators=best_params["n_estimators"],

        min_child_samples=best_params["min_child_samples"],

        feature_fraction=best_params["feature_fraction"],

        bagging_fraction=best_params["bagging_fraction"],

        reg_alpha=best_params["reg_alpha"],

        reg_lambda=best_params["reg_lambda"]

    )

    return model
# ------------------------------------------------------
# Run Final Pipeline
# ------------------------------------------------------

def run_final_pipeline():

    X, y, feature_names = load_dataset()

    best_params = load_best_parameters()

    skf = StratifiedKFold(**CV_CONFIG)

    smote = SMOTE(**SMOTE_CONFIG)

    fold_f1 = []
    fold_auc = []
    fold_precision = []
    fold_recall = []
    fold_confusion = []

    all_true = []
    all_pred = []
    all_proba = []

    trained_models = []

    print("\n" + "=" * 60)
    print("FINAL MODEL TRAINING")
    print("=" * 60)

    for fold, (train_idx, test_idx) in enumerate(
        skf.split(X, y), start=1
    ):

        print(f"\nFold {fold}/5")

        X_train = X[train_idx]
        X_test = X[test_idx]

        y_train = y[train_idx]
        y_test = y[test_idx]

        # -----------------------------------
        # Apply SMOTE ONLY on Training Data
        # -----------------------------------

        X_train_res, y_train_res = smote.fit_resample(
            X_train,
            y_train
        )

        model = create_final_model(best_params)

        model.fit(
            X_train_res,
            y_train_res
        )

        trained_models.append(model)

        y_pred = model.predict(X_test)

        y_proba = model.predict_proba(
            X_test
        )[:, 1]

        f1 = f1_score(
            y_test,
            y_pred,
            average="macro",
            zero_division=0
        )

        auc = roc_auc_score(
            y_test,
            y_proba
        )

        precision = precision_score(
            y_test,
            y_pred,
            average="macro",
            zero_division=0
        )

        recall = recall_score(
            y_test,
            y_pred,
            average="macro",
            zero_division=0
        )

        cm = confusion_matrix(
            y_test,
            y_pred
        )

        fold_f1.append(f1)
        fold_auc.append(auc)
        fold_precision.append(precision)
        fold_recall.append(recall)
        fold_confusion.append(cm)

        all_true.extend(y_test)
        all_pred.extend(y_pred)
        all_proba.extend(y_proba)

        print(
            f"Macro F1 : {f1:.4f} | "
            f"ROC AUC : {auc:.4f}"
        )

    # -----------------------------------
    # Prepare Results Dictionary
    # -----------------------------------

    results = {

        "mean_f1": np.mean(fold_f1),

        "std_f1": np.std(fold_f1),

        "mean_auc": np.mean(fold_auc),

        "std_auc": np.std(fold_auc),

        "mean_precision": np.mean(fold_precision),

        "mean_recall": np.mean(fold_recall),

        "fold_f1": fold_f1,

        "fold_auc": fold_auc,

        "fold_precision": fold_precision,

        "fold_recall": fold_recall,

        "fold_confusion": fold_confusion,

        "all_y_true": np.array(all_true),

        "all_y_pred": np.array(all_pred),

        "all_y_proba": np.array(all_proba),

        "trained_models": trained_models,

        "feature_names": feature_names,

        "best_parameters": best_params

    }

    return results


# ------------------------------------------------------
# Print Evaluation Summary
# ------------------------------------------------------

def print_summary(results):

    print("\n" + "=" * 60)
    print("FINAL MODEL SUMMARY")
    print("=" * 60)

    print(f"Macro F1        : {results['mean_f1']:.4f}")
    print(f"ROC AUC         : {results['mean_auc']:.4f}")
    print(f"Precision       : {results['mean_precision']:.4f}")
    print(f"Recall          : {results['mean_recall']:.4f}")

    print("\nClassification Report\n")

    print(

        classification_report(

            results["all_y_true"],

            results["all_y_pred"],

            target_names=[

                "No Failure",

                "Failure"

            ],

            zero_division=0

        )

    )

    print("=" * 60)
    # ------------------------------------------------------
# Save Final Results
# ------------------------------------------------------

def save_results(results):

    summary_path = os.path.join(
        RESULT_DIR,
        "final_model_results.txt"
    )

    with open(summary_path, "w") as f:

        f.write("=" * 70 + "\n")
        f.write("FINAL MODEL EVALUATION SUMMARY\n")
        f.write("=" * 70 + "\n\n")

        f.write("Performance Metrics\n")
        f.write("-" * 40 + "\n")

        f.write(f"Macro F1        : {results['mean_f1']:.4f}\n")
        f.write(f"Std F1          : {results['std_f1']:.4f}\n")
        f.write(f"ROC AUC         : {results['mean_auc']:.4f}\n")
        f.write(f"Std ROC AUC     : {results['std_auc']:.4f}\n")
        f.write(f"Precision       : {results['mean_precision']:.4f}\n")
        f.write(f"Recall          : {results['mean_recall']:.4f}\n\n")

        f.write("Best Hyperparameters\n")
        f.write("-" * 40 + "\n")

        for key, value in results["best_parameters"].items():
            f.write(f"{key:<25}: {value}\n")

        f.write("\nClassification Report\n")
        f.write("-" * 40 + "\n")

        report = classification_report(
            results["all_y_true"],
            results["all_y_pred"],
            target_names=[
                "No Failure",
                "Failure"
            ],
            zero_division=0
        )

        f.write(report)

    print(f"\nResults saved to:\n{summary_path}")


# ------------------------------------------------------
# Main Function
# ------------------------------------------------------

def main():

    print("=" * 70)
    print("FINAL WEEK 3 MODEL PIPELINE")
    print("=" * 70)

    results = run_final_pipeline()

    print_summary(results)

    save_results(results)

    print("\n" + "=" * 70)
    print("FINAL MODEL PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 70)

    print("\nGenerated Output")

    print(f"✔ Summary File : {os.path.join(RESULT_DIR, 'final_model_results.txt')}")
    print("✔ Results Dictionary Ready")
    print("✔ Models Available for Further Analysis")


# ------------------------------------------------------
# Entry Point
# ------------------------------------------------------

if __name__ == "__main__":

    main()
    