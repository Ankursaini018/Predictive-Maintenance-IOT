"""
=========================================================
optuna_tuner.py
=========================================================

Project:
Predictive Maintenance using LightGBM + SMOTE

Week 3 - Day 2
Commit 2

Description
-----------
Bayesian Hyperparameter Optimization using Optuna.

Pipeline:
Dataset
    ↓
Stratified K-Fold
    ↓
SMOTE (Training Fold Only)
    ↓
LightGBM
    ↓
Macro F1
    ↓
Optuna Optimization
=========================================================
"""

import os
import sys
import json
import warnings
warnings.filterwarnings("ignore")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import numpy as np
import pandas as pd

import optuna
optuna.logging.set_verbosity(optuna.logging.WARNING)

import lightgbm as lgb

from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score

from imblearn.over_sampling import SMOTE

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

# =========================================================
# CONFIGURATION
# =========================================================

CV_CONFIG = {

    "n_splits": 5,

    "shuffle": True,

    "random_state": 42

}

SMOTE_CONFIG = {

    "random_state": 42,

    "k_neighbors": 5,

    "sampling_strategy": "minority"

}

BASE_PARAMS = {

    "objective": "binary",

    "metric": "binary_logloss",

    "boosting_type": "gbdt",

    "class_weight": "balanced",

    "random_state": 42,

    "verbosity": -1

}

# =========================================================
# LOAD DATASET
# =========================================================

print("=" * 60)
print("Loading Fused Dataset...")
print("=" * 60)

fused_df = create_fused_dataset(
    "data/ai4i2020.csv"
)

X, y, feature_names = get_fused_arrays(
    fused_df
)

print(f"Dataset Shape : {X.shape}")
print(f"Features      : {len(feature_names)}")
print(f"Failure Rate  : {100 * y.mean():.2f}%")

# =========================================================
# OPTUNA OBJECTIVE FUNCTION
# =========================================================

def objective(trial):

    params = BASE_PARAMS.copy()

    params.update({

        "num_leaves": trial.suggest_int(
            "num_leaves",
            15,
            100
        ),

        "learning_rate": trial.suggest_float(
            "learning_rate",
            0.005,
            0.2,
            log=True
        ),

        "n_estimators": trial.suggest_int(
            "n_estimators",
            100,
            600
        ),

        "min_child_samples": trial.suggest_int(
            "min_child_samples",
            5,
            40
        ),

        "feature_fraction": trial.suggest_float(
            "feature_fraction",
            0.6,
            1.0
        ),

        "bagging_fraction": trial.suggest_float(
            "bagging_fraction",
            0.6,
            1.0
        ),

        "reg_alpha": trial.suggest_float(
            "reg_alpha",
            1e-8,
            10.0,
            log=True
        ),

        "reg_lambda": trial.suggest_float(
            "reg_lambda",
            1e-8,
            10.0,
            log=True
        )

    })

    skf = StratifiedKFold(**CV_CONFIG)

    smote = SMOTE(**SMOTE_CONFIG)

    fold_scores = []

    for train_idx, test_idx in skf.split(X, y):

        X_train = X[train_idx]
        X_test = X[test_idx]

        y_train = y[train_idx]
        y_test = y[test_idx]

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

    return np.mean(fold_scores)
# =========================================================
# RUN OPTUNA STUDY
# =========================================================

def run_optuna_study(n_trials=30):

    print("\n" + "=" * 60)
    print(f"Starting Optuna Optimization ({n_trials} Trials)")
    print("=" * 60)

    study = optuna.create_study(
        direction="maximize",
        study_name="LightGBM_Hyperparameter_Tuning"
    )

    study.optimize(
        objective,
        n_trials=n_trials,
        show_progress_bar=True
    )

    print("\n" + "=" * 60)
    print("OPTUNA COMPLETED")
    print("=" * 60)

    print(f"Best Trial : {study.best_trial.number}")
    print(f"Best Macro F1 : {study.best_value:.4f}")

    print("\nBest Parameters\n")

    for key, value in study.best_params.items():

        print(f"{key:<25}: {value}")

    return study


# =========================================================
# SAVE BEST PARAMETERS
# =========================================================

def save_best_parameters(study):

    output_dir = os.path.join(
        CURRENT_DIR,
        "tuning_results"
    )

    os.makedirs(
        output_dir,
        exist_ok=True
    )

    best_config = BASE_PARAMS.copy()

    best_config.update(
        study.best_params
    )

    best_config["best_macro_f1"] = round(
        study.best_value,
        4
    )

    json_path = os.path.join(
        output_dir,
        "optuna_best_parameters.json"
    )

    with open(json_path, "w") as f:

        json.dump(
            best_config,
            f,
            indent=4
        )

    print("\nBest Parameters Saved Successfully")

    print(json_path)


# =========================================================
# SAVE ALL TRIAL RESULTS
# =========================================================

def save_trial_history(study):

    output_dir = os.path.join(
        CURRENT_DIR,
        "tuning_results"
    )

    os.makedirs(
        output_dir,
        exist_ok=True
    )

    trial_data = []

    for trial in study.trials:

        row = {

            "Trial": trial.number,

            "Macro F1": trial.value

        }

        row.update(trial.params)

        trial_data.append(row)

    history_df = pd.DataFrame(
        trial_data
    )

    history_path = os.path.join(
        output_dir,
        "optuna_trial_history.csv"
    )

    history_df.to_csv(
        history_path,
        index=False
    )

    print("\nTrial History Saved")

    print(history_path)

    return history_df


# =========================================================
# DISPLAY TOP TRIALS
# =========================================================

def show_top_trials(history_df):

    print("\n")
    print("=" * 60)
    print("TOP 10 TRIALS")
    print("=" * 60)

    history_df = history_df.sort_values(

        by="Macro F1",

        ascending=False

    )

    print(

        history_df.head(10).to_string(index=False)

    )

    return history_df


# =========================================================
# COMPLETE OPTUNA PIPELINE
# =========================================================

def optimize_model(trials=30):

    study = run_optuna_study(
        n_trials=trials
    )

    save_best_parameters(
        study
    )

    history_df = save_trial_history(
        study
    )

    history_df = show_top_trials(
        history_df
    )

    return study, history_df
import matplotlib.pyplot as plt

# =========================================================
# PLOT OPTIMIZATION HISTORY
# =========================================================

def plot_optimization_history(history_df):

    output_dir = os.path.join(
        CURRENT_DIR,
        "tuning_results"
    )

    plt.figure(figsize=(10,6))

    plt.plot(
        history_df["Trial"],
        history_df["Macro F1"],
        marker="o",
        linewidth=2
    )

    plt.xlabel("Trial")

    plt.ylabel("Macro F1")

    plt.title("Optuna Optimization History")

    plt.grid(True)

    plt.tight_layout()

    plot_path = os.path.join(
        output_dir,
        "optimization_history.png"
    )

    plt.savefig(plot_path)

    plt.show()

    print("\nOptimization history saved.")

    print(plot_path)


# =========================================================
# PLOT PARAMETER IMPORTANCE
# =========================================================

def plot_parameter_importance(study):

    try:

        importance = optuna.importance.get_param_importances(
            study
        )

        importance_df = pd.DataFrame({

            "Parameter": importance.keys(),

            "Importance": importance.values()

        })

        importance_df = importance_df.sort_values(
            by="Importance",
            ascending=True
        )

        plt.figure(figsize=(8,6))

        plt.barh(
            importance_df["Parameter"],
            importance_df["Importance"]
        )

        plt.xlabel("Importance")

        plt.title("Optuna Parameter Importance")

        plt.tight_layout()

        plot_path = os.path.join(
            CURRENT_DIR,
            "tuning_results",
            "parameter_importance.png"
        )

        plt.savefig(plot_path)

        plt.show()

        print("\nParameter importance saved.")

        print(plot_path)

    except Exception as e:

        print("\nCould not generate parameter importance plot.")

        print(e)


# =========================================================
# MAIN
# =========================================================

def main():

    print("="*70)

    print("LIGHTGBM + OPTUNA HYPERPARAMETER TUNING")

    print("="*70)

    study, history_df = optimize_model(
        trials=30
    )

    plot_optimization_history(
        history_df
    )

    plot_parameter_importance(
        study
    )

    print("\n")

    print("="*70)

    print("OPTUNA COMPLETED SUCCESSFULLY")

    print("="*70)

    print(f"Best Macro F1 : {study.best_value:.4f}")

    print("\nBest Parameters\n")

    for key, value in study.best_params.items():

        print(f"{key:<25}: {value}")

    print("\nResults saved inside")

    print("src/tuning_results/")


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":

    main()