"""
threshold_analysis_report.py
============================

Week 4 - Day 2
Commit 4

Threshold Optimization Report
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

CSV_FILE = os.path.join(
    RESULT_DIR,
    "threshold_results.csv"
)

REPORT_FILE = os.path.join(
    RESULT_DIR,
    "threshold_analysis_report.txt"
)

# ============================================================
# Load Threshold Results
# ============================================================

def load_results():

    print("=" * 60)
    print("LOADING THRESHOLD RESULTS")
    print("=" * 60)

    if not os.path.exists(CSV_FILE):
        raise FileNotFoundError(
            f"Threshold results file not found:\n{CSV_FILE}"
        )

    results = pd.read_csv(CSV_FILE)

    print("\nDataset Loaded Successfully")

    print(f"Total Thresholds Evaluated : {len(results)}")

    print("\nPreview:\n")

    print(results.head())

    return results


# ============================================================
# Generate Report
# ============================================================

def generate_report(results):

    best = results.loc[
        results["F1 Score"].idxmax()
    ]

    report = []

    report.append("=" * 70)
    report.append("THRESHOLD OPTIMIZATION REPORT")
    report.append("=" * 70)
    report.append("")

    report.append("BEST MODEL PERFORMANCE")
    report.append("-" * 70)

    report.append(
        f"Best Threshold : {best['Threshold']:.2f}"
    )

    report.append(
        f"Precision      : {best['Precision']:.4f}"
    )

    report.append(
        f"Recall         : {best['Recall']:.4f}"
    )

    report.append(
        f"F1 Score       : {best['F1 Score']:.4f}"
    )

    report.append(
        f"Accuracy       : {best['Accuracy']:.4f}"
    )

    report.append("")

    report.append("SUMMARY")
    report.append("-" * 70)

    report.append(
        f"Total Thresholds Tested : {len(results)}"
    )

    report.append(
        f"Minimum Threshold       : {results['Threshold'].min():.2f}"
    )

    report.append(
        f"Maximum Threshold       : {results['Threshold'].max():.2f}"
    )

    report.append("")

    report.append("Threshold optimization completed successfully.")

    return "\n".join(report)
# ============================================================
# Save Report
# ============================================================

def save_report(report):

    with open(
        REPORT_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        f.write(report)

    print("\n" + "=" * 60)
    print("REPORT SAVED SUCCESSFULLY")
    print("=" * 60)

    print(f"\nReport saved at:\n{REPORT_FILE}")


# ============================================================
# Main Pipeline
# ============================================================

def main():

    print("=" * 70)
    print("WEEK 4 - DAY 2")
    print("THRESHOLD ANALYSIS REPORT")
    print("=" * 70)

    results = load_results()

    report = generate_report(results)

    print("\n")
    print(report)

    save_report(report)

    print("\n" + "=" * 70)
    print("THRESHOLD REPORT GENERATED SUCCESSFULLY")
    print("=" * 70)

    return {

        "results": results,

        "report": report

    }


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":

    main()
    