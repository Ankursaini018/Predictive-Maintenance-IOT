"""
=========================================================
model_saver.py
=========================================================

Project:
Predictive Maintenance using LightGBM

Week 3 - Day 4
Commit 3

Description
-----------
Save the trained LightGBM model and
all metadata required for reproducibility.

This script reuses the final pipeline.
=========================================================
"""

import os
import json
import pickle
from datetime import datetime

import numpy as np

from final_model_pipeline import run_final_pipeline

# ------------------------------------------------------
# Paths
# ------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

MODEL_DIR = os.path.join(

    PROJECT_ROOT,

    "models"

)

os.makedirs(

    MODEL_DIR,

    exist_ok=True

)

# ------------------------------------------------------
# Save Model
# ------------------------------------------------------

def save_best_model(results):

    best_fold = int(

        np.argmax(

            results["fold_f1"]

        )

    )

    best_model = results["trained_models"][best_fold]

    model_path = os.path.join(

        MODEL_DIR,

        "lightgbm_best_model.pkl"

    )

    with open(model_path,"wb") as f:

        pickle.dump(

            best_model,

            f

        )

    print("="*60)

    print("Best Model Saved")

    print("="*60)

    print(model_path)

    return model_path
# ------------------------------------------------------
# Save Model Metadata
# ------------------------------------------------------

def save_model_metadata(results):

    metadata = {

        "model_name": "LightGBM",

        "saved_on": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),

        "best_fold": int(
            np.argmax(results["fold_f1"]) + 1
        ),

        "macro_f1": float(results["mean_f1"]),

        "macro_f1_std": float(results["std_f1"]),

        "roc_auc": float(results["mean_auc"]),

        "precision": float(results["mean_precision"]),

        "recall": float(results["mean_recall"]),

        "number_of_features": len(
            results["feature_names"]
        ),

        "feature_names": list(
            results["feature_names"]
        ),

        "hyperparameters": results["best_parameters"],

        "training_strategy": {
            "cross_validation": "Stratified 5-Fold",
            "sampling": "SMOTE (Training Fold Only)",
            "algorithm": "LightGBM",
            "random_state": 42
        }

    }

    metadata_path = os.path.join(

        CURRENT_DIR,

        "model_metadata.json"

    )

    with open(metadata_path, "w") as f:

        json.dump(

            metadata,

            f,

            indent=4

        )

    print("\nModel metadata saved.")

    print(metadata_path)

    return metadata_path


# ------------------------------------------------------
# Generate Reproduction Guide
# ------------------------------------------------------

def generate_reproduction_guide():

    guide = """
=========================================================
MODEL REPRODUCTION GUIDE
=========================================================

This project stores only metadata on GitHub.

The trained model (.pkl) is generated locally.

To reproduce the model:

1. Place dataset in:

   data/ai4i2020.csv

2. Run:

   python src/final_model_pipeline.py

3. Save the trained model:

   python src/model_saver.py

Generated files:

models/
    lightgbm_best_model.pkl

src/
    model_metadata.json

=========================================================
"""

    guide_path = os.path.join(

        CURRENT_DIR,

        "reproduction_guide.txt"

    )

    with open(guide_path, "w") as f:

        f.write(guide)

    print("\nReproduction guide created.")

    print(guide_path)

    return guide_path
# ------------------------------------------------------
# Main Function
# ------------------------------------------------------

def main():

    print("=" * 70)
    print("MODEL PERSISTENCE PIPELINE")
    print("=" * 70)

    print("\nRunning Final Model Pipeline...\n")

    results = run_final_pipeline()

    print("\nSaving Best Model...\n")

    model_path = save_best_model(results)

    print("\nSaving Model Metadata...\n")

    metadata_path = save_model_metadata(results)

    print("\nGenerating Reproduction Guide...\n")

    guide_path = generate_reproduction_guide()

    print("\n" + "=" * 70)
    print("MODEL SAVING COMPLETED SUCCESSFULLY")
    print("=" * 70)

    print("\nGenerated Files")

    print(f"✔ Model              : {model_path}")
    print(f"✔ Metadata           : {metadata_path}")
    print(f"✔ Reproduction Guide : {guide_path}")

    print("\nModel Statistics")

    print(f"Macro F1  : {results['mean_f1']:.4f}")
    print(f"ROC AUC   : {results['mean_auc']:.4f}")
    print(f"Precision : {results['mean_precision']:.4f}")
    print(f"Recall    : {results['mean_recall']:.4f}")

    print("\nProject is now fully reproducible.")


# ------------------------------------------------------
# Entry Point
# ------------------------------------------------------

if __name__ == "__main__":

    main()