import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)


def load_fused_dataset():
    """
    Load fused dataset.
    """

    dataset_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "data",
            "ai4i2020.csv"
        )
    )

    fused_df = create_fused_dataset(
        dataset_path
    )

    return fused_df


def plot_correlation_matrix(
    fused_df,
    save_path=None
):
    """
    Plot full correlation matrix.
    """

    numeric_df = fused_df.select_dtypes(
        include=[np.number]
    )

    corr_matrix = numeric_df.corr()

    plt.figure(figsize=(16, 12))

    sns.heatmap(
        corr_matrix,
        cmap="coolwarm",
        center=0
    )

    plt.title(
        "Fusion Dataset Correlation Matrix",
        fontsize=14,
        fontweight="bold"
    )

    plt.tight_layout()

    if save_path:
        plt.savefig(save_path)

    plt.show()

    return corr_matrix


def get_top_correlations(
    fused_df,
    target_column="Machine failure",
    top_n=15
):
    """
    Get strongest correlations with target.
    """

    numeric_df = fused_df.select_dtypes(
        include=[np.number]
    )

    correlations = (
        numeric_df.corr()[target_column]
        .drop(target_column)
        .sort_values(
            key=abs,
            ascending=False
        )
    )

    return correlations.head(top_n)


def plot_target_correlations(
    fused_df,
    target_column="Machine failure",
    top_n=15
):
    """
    Plot strongest target correlations.
    """

    top_corr = get_top_correlations(
        fused_df,
        target_column,
        top_n
    )

    plt.figure(figsize=(10, 6))

    sns.barplot(
        x=top_corr.values,
        y=top_corr.index
    )

    plt.title(
        "Top Feature Correlations with Failure",
        fontweight="bold"
    )

    plt.xlabel("Correlation")

    plt.tight_layout()

    plt.show()

    return top_corr


def save_correlation_report(
    correlations,
    output_path
):
    """
    Save text report.
    """

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(
            "CORRELATION ANALYSIS REPORT\n"
        )

        file.write(
            "=" * 50 + "\n\n"
        )

        for feature, value in correlations.items():

            file.write(
                f"{feature}: {value:.4f}\n"
            )

    print(
        f"Report saved: {output_path}"
    )


if __name__ == "__main__":

    fused_df = load_fused_dataset()

    print(
        f"Dataset Shape: {fused_df.shape}"
    )

    corr_matrix = plot_correlation_matrix(
        fused_df,
        save_path=os.path.join(
            os.path.dirname(__file__),
            "correlation_matrix.png"
        )
    )

    top_corr = plot_target_correlations(
        fused_df
    )

    report_path = os.path.join(
        os.path.dirname(__file__),
        "correlation_report.txt"
    )

    save_correlation_report(
        top_corr,
        report_path
    )

    print("\nTop Correlations:")
    print(top_corr)