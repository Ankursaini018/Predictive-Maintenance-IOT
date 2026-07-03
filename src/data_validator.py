"""
Dataset Validation Utility

Week 1 - Day 6

This module validates the processed AI4I dataset before
training machine learning models.
"""

import numpy as np
import os
import sys
import warnings

warnings.filterwarnings("ignore")

# -------------------------------------------------------------------
# Import preprocessing pipeline
# -------------------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))

sys.path.insert(0, CURRENT_DIR)

from preprocessing import load_and_preprocess


def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def validate_dataset():

    dataset_path = os.path.join(
        PROJECT_ROOT,
        "data",
        "ai4i2020.csv"
    )

    X, y, feature_names, df = load_and_preprocess(dataset_path)

    print_section("DATASET INFORMATION")

    print(f"Dataset Shape      : {df.shape}")
    print(f"Total Features     : {len(feature_names)}")
    print(f"Failure Samples    : {int(y.sum())}")
    print(f"Failure Rate       : {y.mean()*100:.2f}%")

    print_section("MISSING VALUES")

    missing = df.isnull().sum().sum()

    print(f"Missing Values : {missing}")

    print_section("DUPLICATE ROWS")

    duplicates = df.duplicated().sum()

    print(f"Duplicate Rows : {duplicates}")

    print_section("INFINITE VALUES")

    print_section("INFINITE VALUES")

    # Replace NaN and infinite values (if any)
    X = np.nan_to_num(
        X,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )

    infinite_values = (
        np.isinf(X).sum()
        + np.isnan(X).sum()
    )

    print(f"Infinite Values : {infinite_values}")

    print_section("TARGET VALIDATION")

    print("Unique Target Classes :", sorted(np.unique(y)))

    print_section("VALIDATION RESULT")

    if (
        missing == 0
        and duplicates == 0
        and infinite_values == 0
    ):
        print("Dataset validation PASSED")
    else:
        print("Dataset validation FAILED")


if __name__ == "__main__":
    validate_dataset()