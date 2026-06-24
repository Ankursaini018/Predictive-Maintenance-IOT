import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from correlation_analysis import load_fused_dataset


def plot_torque_vs_wear(df):

    if (
        "Torque [Nm]" not in df.columns
        or
        "Tool wear [min]" not in df.columns
    ):
        print("Required columns not found.")
        return

    plt.figure(figsize=(8, 6))

    sns.scatterplot(
        data=df,
        x="Tool wear [min]",
        y="Torque [Nm]",
        hue="Machine failure",
        alpha=0.5
    )

    plt.title(
        "Torque vs Tool Wear"
    )

    plt.tight_layout()

    plt.savefig(
        os.path.join(
            os.path.dirname(__file__),
            "torque_vs_wear.png"
        )
    )

    plt.show()


def plot_temperature_vs_torque(df):

    temp_col = "Air temperature [K]"

    if (
        temp_col not in df.columns
        or
        "Torque [Nm]" not in df.columns
    ):
        print("Required columns not found.")
        return

    plt.figure(figsize=(8, 6))

    sns.scatterplot(
        data=df,
        x=temp_col,
        y="Torque [Nm]",
        hue="Machine failure",
        alpha=0.5
    )

    plt.title(
        "Temperature vs Torque"
    )

    plt.tight_layout()

    plt.savefig(
        os.path.join(
            os.path.dirname(__file__),
            "temperature_vs_torque.png"
        )
    )

    plt.show()


def plot_failure_distribution(df):

    plt.figure(figsize=(6, 4))

    sns.countplot(
        data=df,
        x="Machine failure"
    )

    plt.title(
        "Failure Distribution"
    )

    plt.tight_layout()

    plt.savefig(
        os.path.join(
            os.path.dirname(__file__),
            "failure_distribution.png"
        )
    )

    plt.show()


def plot_key_feature_boxplots(df):

    candidate_features = [
        "Torque [Nm]",
        "Tool wear [min]",
        "Air temperature [K]"
    ]

    available = [
        c for c in candidate_features
        if c in df.columns
    ]

    for feature in available:

        plt.figure(figsize=(7, 5))

        sns.boxplot(
            data=df,
            x="Machine failure",
            y=feature
        )

        plt.title(
            f"{feature} vs Failure"
        )

        plt.tight_layout()

        safe_name = (
            feature
            .replace("/", "_")
            .replace("[", "")
            .replace("]", "")
            .replace(" ", "_")
        )

        plt.savefig(
            os.path.join(
                os.path.dirname(__file__),
                f"{safe_name}_boxplot.png"
            )
        )

        plt.show()


if __name__ == "__main__":

    fused_df = load_fused_dataset()

    plot_torque_vs_wear(fused_df)

    plot_temperature_vs_torque(fused_df)

    plot_failure_distribution(fused_df)

    plot_key_feature_boxplots(fused_df)

    print(
        "\nInteraction analysis complete."
    )