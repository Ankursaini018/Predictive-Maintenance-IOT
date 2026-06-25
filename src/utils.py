"""
utils.py
========

Common utility functions used across
the Predictive Maintenance project.
"""

import os
from datetime import datetime


def print_section(title: str, width: int = 60):
    """
    Print formatted section header.
    """

    print("\n" + "=" * width)
    print(title.center(width))
    print("=" * width)


def print_metrics(metrics: dict):
    """
    Pretty print evaluation metrics.
    """

    print_section("METRICS")

    for key, value in metrics.items():

        if isinstance(value, float):
            print(f"{key:<25}: {value:.4f}")
        else:
            print(f"{key:<25}: {value}")


def get_timestamp():
    """
    Return current timestamp.
    """

    return datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def check_data_path(filepath):
    """
    Verify dataset path.
    """

    if os.path.exists(filepath):
        print(f"Dataset Found:\n{filepath}")
        return True

    print(f"Dataset Missing:\n{filepath}")
    return False


def summarize_dataset(
    X,
    y,
    feature_names
):
    """
    Print dataset summary.
    """

    print_section("DATASET SUMMARY")

    print(f"Samples : {X.shape[0]}")
    print(f"Features: {X.shape[1]}")
    print(f"Failures: {y.sum()}")
    print(f"Failure Rate: {y.mean()*100:.2f}%")

    print("\nFirst 10 Features:")

    for feature in feature_names[:10]:
        print(f"• {feature}")


if __name__ == "__main__":

    print_section("UTILS TEST")

    print(get_timestamp())

    print_metrics({
        "Accuracy": 0.9843,
        "Macro F1": 0.9012,
        "ROC AUC": 0.9421
    })