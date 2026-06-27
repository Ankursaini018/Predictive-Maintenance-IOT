"""
results_visualizer.py
=====================

Visualization utilities for
LightGBM + SMOTE model evaluation.

Infotact DS/ML Internship
Project 1
Week 3
"""

import matplotlib.pyplot as plt
import numpy as np

from sklearn.metrics import (
    roc_curve,
    auc,
    precision_recall_curve,
    average_precision_score
)

plt.style.use("seaborn-v0_8")


# ---------------------------------------------------
# ROC CURVE
# ---------------------------------------------------

def plot_roc_curve(
    y_true,
    y_scores,
    save_path="src/roc_curve.png"
):
    """
    Plot ROC Curve.

    Parameters
    ----------
    y_true : array-like
        Ground truth labels.

    y_scores : array-like
        Prediction probabilities.

    save_path : str
        Output image path.
    """

    fpr, tpr, _ = roc_curve(
        y_true,
        y_scores
    )

    roc_auc = auc(
        fpr,
        tpr
    )

    plt.figure(figsize=(7,6))

    plt.plot(
        fpr,
        tpr,
        linewidth=2,
        label=f"ROC AUC = {roc_auc:.4f}"
    )

    plt.plot(
        [0,1],
        [0,1],
        "--",
        linewidth=1
    )

    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve")

    plt.legend(
        loc="lower right"
    )

    plt.grid(True)

    plt.tight_layout()

    plt.savefig(
        save_path,
        dpi=300
    )

    plt.show()

    return roc_auc
# ---------------------------------------------------
# PRECISION-RECALL CURVE
# ---------------------------------------------------

def plot_pr_curve(
    y_true,
    y_scores,
    save_path="src/pr_curve.png"
):
    """
    Plot Precision-Recall Curve.
    """

    precision, recall, _ = precision_recall_curve(
        y_true,
        y_scores
    )

    pr_auc = average_precision_score(
        y_true,
        y_scores
    )

    plt.figure(figsize=(7,6))

    plt.plot(
        recall,
        precision,
        linewidth=2,
        label=f"PR AUC = {pr_auc:.4f}"
    )

    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Precision-Recall Curve")

    plt.legend(loc="lower left")

    plt.grid(True)

    plt.tight_layout()

    plt.savefig(
        save_path,
        dpi=300
    )

    plt.show()

    return pr_auc


# ---------------------------------------------------
# COMBINED RESULTS DASHBOARD
# ---------------------------------------------------

def plot_combined_results(
    results,
    save_path="src/week3_results_dashboard.png"
):
    """
    Plot fold-wise performance metrics.
    """

    folds = np.arange(
        1,
        len(results["fold_f1"]) + 1
    )

    plt.figure(figsize=(10,6))

    plt.plot(
        folds,
        results["fold_f1"],
        marker="o",
        linewidth=2,
        label="Macro F1"
    )

    plt.plot(
        folds,
        results["fold_auc"],
        marker="s",
        linewidth=2,
        label="ROC AUC"
    )

    plt.plot(
        folds,
        results["fold_precision"],
        marker="^",
        linewidth=2,
        label="Precision"
    )

    plt.plot(
        folds,
        results["fold_recall"],
        marker="d",
        linewidth=2,
        label="Recall"
    )

    plt.xticks(folds)

    plt.xlabel("Cross Validation Fold")
    plt.ylabel("Score")

    plt.title(
        "LightGBM + SMOTE Performance Across Folds"
    )

    plt.ylim(0, 1.05)

    plt.grid(True)

    plt.legend()

    plt.tight_layout()

    plt.savefig(
        save_path,
        dpi=300
    )

    plt.show()

    print("\nPerformance Summary")
    print("-" * 40)

    print(
        f"Macro F1  : {np.mean(results['fold_f1']):.4f}"
    )

    print(
        f"ROC AUC   : {np.mean(results['fold_auc']):.4f}"
    )

    print(
        f"Precision : {np.mean(results['fold_precision']):.4f}"
    )

    print(
        f"Recall    : {np.mean(results['fold_recall']):.4f}"
    )

    print(
        f"\nDashboard saved to: {save_path}"
    )