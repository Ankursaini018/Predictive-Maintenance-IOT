import os
import pandas as pd
import numpy as np

from correlation_analysis import load_fused_dataset


def generate_profile_report(df):

    report = []

    report.append("=" * 60)
    report.append("FUSED DATASET PROFILE REPORT")
    report.append("=" * 60)

    report.append(f"\nRows: {df.shape[0]}")
    report.append(f"Columns: {df.shape[1]}")

    report.append("\nDATA TYPES")
    report.append("-" * 40)

    dtype_counts = df.dtypes.value_counts()

    for dtype, count in dtype_counts.items():
        report.append(f"{dtype}: {count}")

    report.append("\nMISSING VALUES")
    report.append("-" * 40)

    missing = df.isnull().sum()
    missing = missing[missing > 0]

    if len(missing) == 0:
        report.append("No missing values found.")
    else:
        for col, count in missing.items():
            report.append(f"{col}: {count}")

    report.append("\nTARGET DISTRIBUTION")
    report.append("-" * 40)

    if "Machine failure" in df.columns:

        counts = df["Machine failure"].value_counts()

        for label, value in counts.items():
            report.append(
                f"Class {label}: {value}"
            )

        failure_rate = (
            df["Machine failure"].mean()
            * 100
        )

        report.append(
            f"\nFailure Rate: {failure_rate:.2f}%"
        )

    report.append("\nNUMERICAL SUMMARY")
    report.append("-" * 40)

    numeric_df = df.select_dtypes(
        include=[np.number]
    )

    summary = numeric_df.describe().T

    for column in summary.index:

        report.append(
            f"\n{column}"
        )

        report.append(
            f"Mean : {summary.loc[column,'mean']:.4f}"
        )

        report.append(
            f"Std  : {summary.loc[column,'std']:.4f}"
        )

        report.append(
            f"Min  : {summary.loc[column,'min']:.4f}"
        )

        report.append(
            f"Max  : {summary.loc[column,'max']:.4f}"
        )

    return "\n".join(report)


def save_report(report):

    report_path = os.path.join(
        os.path.dirname(__file__),
        "dataset_profile.txt"
    )

    with open(
        report_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(report)

    print(
        f"\nReport saved: {report_path}"
    )


if __name__ == "__main__":

    fused_df = load_fused_dataset()

    report = generate_profile_report(
        fused_df
    )

    print(report)

    save_report(report)