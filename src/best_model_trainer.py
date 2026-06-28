"""
=========================================================
best_model_trainer.py
=========================================================

Project:
Predictive Maintenance using LightGBM + SMOTE

Week 3 - Day 2
Commit 4

Description
-----------
Train the final tuned LightGBM model using the
best hyperparameters obtained from Optuna.

Pipeline
--------
Dataset
    ↓
Stratified 5 Fold
    ↓
SMOTE (Training Fold Only)
    ↓
LightGBM
    ↓
Evaluation
    ↓
Save Best Model
=========================================================
"""

import os
import sys
import json
import pickle
import warnings

warnings.filterwarnings("ignore")

# --------------------------------------------------------
# Project Paths
# --------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# --------------------------------------------------------
# Libraries
# --------------------------------------------------------

import numpy as np
import pandas as pd

from collections import Counter

import lightgbm as lgb

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

# --------------------------------------------------------
# Configuration
# --------------------------------------------------------

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

MODEL_DIR = os.path.join(
    PROJECT_ROOT,
    "models"
)

RESULT_DIR = os.path.join(
    CURRENT_DIR,
    "tuning_results"
)

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

# --------------------------------------------------------
# Load Best Parameters
# --------------------------------------------------------

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
    print("Best Parameters Loaded")
    print("="*60)

    for key,value in params.items():

        print(f"{key:<25}: {value}")

    return params

# --------------------------------------------------------
# Load Dataset
# --------------------------------------------------------

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

# --------------------------------------------------------
# Build LightGBM Model
# --------------------------------------------------------

def create_model(best_params):

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
# --------------------------------------------------------
# Train using 5-Fold Cross Validation
# --------------------------------------------------------

def train_final_model(X, y, feature_names, best_params):

    skf = StratifiedKFold(**CV_CONFIG)

    smote = SMOTE(**SMOTE_CONFIG)

    fold_f1 = []
    fold_auc = []
    fold_precision = []
    fold_recall = []

    all_true = []
    all_pred = []
    all_proba = []

    trained_models = []

    print("\n" + "=" * 60)
    print("Training Final LightGBM Model")
    print("=" * 60)

    for fold, (train_idx, test_idx) in enumerate(skf.split(X, y), start=1):

        print(f"\nFold {fold}/5")

        X_train = X[train_idx]
        X_test = X[test_idx]

        y_train = y[train_idx]
        y_test = y[test_idx]

        # ---------------------------------------
        # Apply SMOTE ONLY on training data
        # ---------------------------------------

        X_train_res, y_train_res = smote.fit_resample(
            X_train,
            y_train
        )

        print(f"Training Shape : {X_train_res.shape}")
        print(f"Testing Shape  : {X_test.shape}")

        model = create_model(best_params)

        model.fit(
            X_train_res,
            y_train_res
        )

        trained_models.append(model)

        y_pred = model.predict(X_test)

        y_prob = model.predict_proba(X_test)[:, 1]

        f1 = f1_score(
            y_test,
            y_pred,
            average="macro",
            zero_division=0
        )

        auc = roc_auc_score(
            y_test,
            y_prob
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

        fold_f1.append(f1)
        fold_auc.append(auc)
        fold_precision.append(precision)
        fold_recall.append(recall)

        all_true.extend(y_test)
        all_pred.extend(y_pred)
        all_proba.extend(y_prob)

        print(f"Macro F1 : {f1:.4f}")
        print(f"ROC AUC  : {auc:.4f}")

    results = {

        "mean_f1": np.mean(fold_f1),

        "std_f1": np.std(fold_f1),

        "mean_auc": np.mean(fold_auc),

        "std_auc": np.std(fold_auc),

        "mean_precision": np.mean(fold_precision),

        "mean_recall": np.mean(fold_recall),

        "all_true": np.array(all_true),

        "all_pred": np.array(all_pred),

        "all_proba": np.array(all_proba),

        "trained_models": trained_models,

        "feature_names": feature_names

    }

    return results


# --------------------------------------------------------
# Save Best Model
# --------------------------------------------------------

def save_best_model(results):

    model_path = os.path.join(

        MODEL_DIR,

        "best_lightgbm_model.pkl"

    )

    with open(model_path, "wb") as f:

        pickle.dump(

            results["trained_models"][0],

            f

        )

    print("\nBest model saved successfully.")

    print(model_path)


# --------------------------------------------------------
# Display Final Metrics
# --------------------------------------------------------

def display_results(results):

    print("\n" + "=" * 60)

    print("FINAL MODEL PERFORMANCE")

    print("=" * 60)

    print(f"Macro F1        : {results['mean_f1']:.4f}")

    print(f"ROC AUC         : {results['mean_auc']:.4f}")

    print(f"Precision       : {results['mean_precision']:.4f}")

    print(f"Recall          : {results['mean_recall']:.4f}")

    print("\nClassification Report\n")

    print(

        classification_report(

            results["all_true"],

            results["all_pred"],

            target_names=[

                "No Failure",

                "Failure"

            ],

            zero_division=0

        )

    )

    return
# --------------------------------------------------------
# Save Training Summary
# --------------------------------------------------------

def save_training_summary(results, best_params):

    summary_path = os.path.join(
        RESULT_DIR,
        "best_model_summary.txt"
    )

    with open(summary_path, "w") as f:

        f.write("=" * 60 + "\n")
        f.write("FINAL LIGHTGBM MODEL SUMMARY\n")
        f.write("=" * 60 + "\n\n")

        f.write("Best Hyperparameters\n")
        f.write("-" * 30 + "\n")

        for key, value in best_params.items():
            f.write(f"{key:<25}: {value}\n")

        f.write("\n")

        f.write("Performance Metrics\n")
        f.write("-" * 30 + "\n")

        f.write(f"Macro F1        : {results['mean_f1']:.4f}\n")
        f.write(f"ROC AUC         : {results['mean_auc']:.4f}\n")
        f.write(f"Precision       : {results['mean_precision']:.4f}\n")
        f.write(f"Recall          : {results['mean_recall']:.4f}\n")

        f.write("\n")

        f.write("Classification Report\n")
        f.write("-" * 30 + "\n")

        report = classification_report(
            results["all_true"],
            results["all_pred"],
            target_names=[
                "No Failure",
                "Failure"
            ],
            zero_division=0
        )

        f.write(report)

    print("\nTraining summary saved successfully.")
    print(summary_path)


# --------------------------------------------------------
# Main
# --------------------------------------------------------

def main():

    print("=" * 70)
    print("FINAL LIGHTGBM MODEL TRAINING")
    print("=" * 70)

    # Load best Optuna parameters
    best_params = load_best_parameters()

    # Load dataset
    X, y, feature_names = load_dataset()

    # Train model
    results = train_final_model(
        X,
        y,
        feature_names,
        best_params
    )

    # Display metrics
    display_results(results)

    # Save trained model
    save_best_model(results)

    # Save training summary
    save_training_summary(
        results,
        best_params
    )

    print("\n" + "=" * 70)
    print("FINAL MODEL TRAINING COMPLETED SUCCESSFULLY")
    print("=" * 70)

    print("\nFiles Generated:")

    print(f"✔ {os.path.join(MODEL_DIR, 'best_lightgbm_model.pkl')}")
    print(f"✔ {os.path.join(RESULT_DIR, 'best_model_summary.txt')}")


# --------------------------------------------------------
# Entry Point
# --------------------------------------------------------

if __name__ == "__main__":
    main()