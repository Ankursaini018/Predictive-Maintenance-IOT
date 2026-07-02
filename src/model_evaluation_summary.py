"""
model_evaluation_summary.py
===========================

Week 4 - Day 2
Commit 5

Final Model Evaluation Summary
"""

# ============================================================
# Imports
# ============================================================

import warnings
warnings.filterwarnings("ignore")

import os
import pandas as pd

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT = os.path.abspath(".")

RESULT_DIR = os.path.join(
    PROJECT_ROOT,
    "src",
    "tuning_results"
)

THRESHOLD_FILE = os.path.join(
    RESULT_DIR,
    "threshold_results.csv"
)

REPORT_FILE = os.path.join(
    RESULT_DIR,
    "threshold_analysis_report.txt"
)

FINAL_REPORT = os.path.join(
    RESULT_DIR,
    "model_evaluation_summary.txt"
)
# ============================================================
# Load Results
# ============================================================

def load_results():

    print("=" * 60)
    print("LOADING MODEL RESULTS")
    print("=" * 60)

    threshold_df = pd.read_csv(
        THRESHOLD_FILE
    )

    with open(
        REPORT_FILE,
        "r",
        encoding="utf-8"
    ) as f:

        report = f.read()

    return threshold_df, report
# ============================================================
# Generate Final Summary
# ============================================================

def generate_summary(df, report):

    best = df.loc[
        df["F1 Score"].idxmax()
    ]

    summary = []

    summary.append("=" * 70)
    summary.append("FINAL MODEL EVALUATION SUMMARY")
    summary.append("=" * 70)
    summary.append("")

    summary.append("BEST MODEL METRICS")
    summary.append("-" * 70)

    summary.append(
        f"Threshold : {best['Threshold']:.2f}"
    )

    summary.append(
        f"Precision : {best['Precision']:.4f}"
    )

    summary.append(
        f"Recall    : {best['Recall']:.4f}"
    )

    summary.append(
        f"F1 Score  : {best['F1 Score']:.4f}"
    )

    summary.append(
        f"Accuracy  : {best['Accuracy']:.4f}"
    )

    summary.append("")
    summary.append("Previous Report")
    summary.append("-" * 70)
    summary.append(report)

    return "\n".join(summary)
# ============================================================
# Save Summary
# ============================================================

def save_summary(summary):

    with open(
        FINAL_REPORT,
        "w",
        encoding="utf-8"
    ) as f:

        f.write(summary)

    print("\nSummary saved successfully.")

    print(FINAL_REPORT)
    # ============================================================
# Main
# ============================================================

def main():

    df, report = load_results()

    summary = generate_summary(
        df,
        report
    )

    print(summary)

    save_summary(summary)


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    print("Running Model Evaluation Summary...")
    main()