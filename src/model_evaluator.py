"""
model_evaluator.py
==================

Comprehensive evaluation pipeline
for LightGBM + SMOTE model.

Infotact DS/ML Internship
Project 1
Week 3
"""

import os
import warnings

warnings.filterwarnings("ignore")

from sklearn.metrics import roc_auc_score

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

from lgbm_smote_pipeline import (
    run_lgbm_smote_cv
)


def evaluate_model(data_filepath: str):

    print("=" * 55)
    print("FULL MODEL EVALUATION PIPELINE")
    print("=" * 55)

    # --------------------------------------------------
    # Load fused dataset
    # --------------------------------------------------

    print("\n[1] Loading fused dataset...")

    fused_df = create_fused_dataset(
        data_filepath
    )

    X, y, feature_names = get_fused_arrays(
        fused_df
    )

    print(f"Shape : {X.shape}")

    # --------------------------------------------------
    # Train model
    # --------------------------------------------------

    print("\n[2] Training LightGBM + SMOTE...")

    results = run_lgbm_smote_cv(
        X,
        y,
        feature_names,
        verbose=False
    )

    # --------------------------------------------------
    # Evaluation Metrics
    # --------------------------------------------------

    roc_auc = roc_auc_score(
        results["all_y_true"],
        results["all_y_proba"]
    )

    print("\n" + "=" * 55)
    print("FINAL EVALUATION REPORT")
    print("=" * 55)

    print(
        f"Macro F1  : {results['mean_f1']:.4f}"
        f" ± {results['std_f1']:.4f}"
    )

    print(
        f"ROC AUC   : {roc_auc:.4f}"
    )

    print(
        f"Precision : {results['mean_precision']:.4f}"
    )

    print(
        f"Recall    : {results['mean_recall']:.4f}"
    )
        # --------------------------------------------------
    # Build report
    # --------------------------------------------------

    achieved = (
        "YES"
        if results["mean_f1"] >= 0.85
        else "NO - Tune model further"
    )

    report = f"""
MODEL EVALUATION REPORT
==================================================

Project
-------
Contextual Predictive Maintenance (IoT Edge AI)

Internship
----------
Infotact DS/ML Internship

Week
----
Week 3 - Model Evaluation

==================================================

PERFORMANCE METRICS

Macro F1 Score : {results['mean_f1']:.4f}
F1 Std Dev     : {results['std_f1']:.4f}
ROC AUC        : {roc_auc:.4f}
Precision      : {results['mean_precision']:.4f}
Recall         : {results['mean_recall']:.4f}

==================================================

MODEL CONFIGURATION

Classifier      : LightGBM
Validation       : Stratified 5-Fold CV
Oversampling     : SMOTE (Inside Training Fold)
Samples          : {X.shape[0]}
Features         : {X.shape[1]}

==================================================

TARGET PERFORMANCE

Required F1 Score : 0.85
Achieved          : {achieved}

==================================================
"""

    report_path = os.path.join(
        os.path.dirname(__file__),
        "model_evaluation_report.txt"
    )

    with open(
        report_path,
        "w",
        encoding="utf-8"
    ) as f:
        f.write(report)

    print("\nModel evaluation report saved successfully.")
    print(f"Location : {report_path}")

    print("\nEvaluation Complete.")
    print("=" * 55)

    return results


if __name__ == "__main__":

    evaluate_model(
        "data/ai4i2020.csv"
    )