import os
import numpy as np
import pandas as pd

from pipeline_optimizer import (
    get_selected_dataset
)


def validate_dataset():

    X, y, selected_features = (
        get_selected_dataset()
    )

    results = {}

    # Shape Check
    results["shape_check"] = (
        X.shape[0] > 0
        and
        X.shape[1] > 0
    )

    # Missing Values Check
    results["missing_values"] = (
        pd.DataFrame(X)
        .isnull()
        .sum()
        .sum()
        == 0
    )

    # Infinite Values Check
    results["infinite_values"] = (
        np.isinf(X.values).sum()
        == 0
    )

    # Target Check
    results["target_check"] = (
        len(np.unique(y))
        == 2
    )

    # Feature Count Check
    results["feature_count"] = (
        len(selected_features)
        > 0
    )

    return (
        results,
        X,
        y,
        selected_features
    )


def save_validation_report(
    results,
    X,
    y,
    selected_features
):

    report_path = os.path.join(
        os.path.dirname(__file__),
        "feature_validation_report.txt"
    )

    with open(
        report_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(
            "FEATURE VALIDATION REPORT\n"
        )

        file.write(
            "=" * 50 + "\n\n"
        )

        file.write(
            f"Samples : {X.shape[0]}\n"
        )

        file.write(
            f"Features: {X.shape[1]}\n"
        )

        file.write(
            f"Failures: {y.sum()}\n\n"
        )

        for key, value in results.items():

            status = (
                "PASS"
                if value
                else "FAIL"
            )

            file.write(
                f"{key}: {status}\n"
            )

        file.write(
            "\nSelected Features\n"
        )

        file.write(
            "-" * 30 + "\n"
        )

        for feature in selected_features:

            file.write(
                feature + "\n"
            )

    print(
        f"Saved: {report_path}"
    )


if __name__ == "__main__":

    (
        results,
        X,
        y,
        selected_features
    ) = validate_dataset()

    print("\nVALIDATION RESULTS")
    print("=" * 40)

    for key, value in results.items():

        status = (
            "PASS"
            if value
            else "FAIL"
        )

        print(
            f"{key}: {status}"
        )

    save_validation_report(
        results,
        X,
        y,
        selected_features
    )

    print("\nDataset Ready ✅")