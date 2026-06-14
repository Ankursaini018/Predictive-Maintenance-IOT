"""
Visualization Utilities
-----------------------
Helper functions for plotting:
1. Feature correlations
2. Failure distribution
3. Top correlated features
"""

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

plt.style.use("seaborn-v0_8")


def plot_failure_distribution(y):
    """
    Plot failure vs no failure distribution.

    Args:
        y (pd.Series or array): Target labels
    """
    failure_counts = pd.Series(y).value_counts()

    plt.figure(figsize=(6, 6))

    plt.pie(
        failure_counts,
        labels=["No Failure", "Failure"],
        autopct="%1.2f%%",
        startangle=90,
        explode=(0, 0.12)
    )

    plt.title(
        "Machine Failure Distribution",
        fontsize=13,
        fontweight="bold"
    )

    plt.tight_layout()
    plt.show()


def plot_correlation_heatmap(df):
    """
    Plot correlation heatmap.

    Args:
        df (pd.DataFrame): Dataset
    """
    plt.figure(figsize=(10, 8))

    sns.heatmap(
        df.corr(numeric_only=True),
        cmap="coolwarm",
        annot=False
    )

    plt.title(
        "Feature Correlation Heatmap",
        fontsize=13,
        fontweight="bold"
    )

    plt.tight_layout()
    plt.show()


def plot_top_correlated_features(df, target_col="Machine failure", top_n=15):
    """
    Plot top features correlated with target.

    Args:
        df (pd.DataFrame): Dataset
        target_col (str): Target column
        top_n (int): Number of top features
    """
    corr = (
        df.corr(numeric_only=True)[target_col]
        .drop(target_col)
        .sort_values(key=abs, ascending=False)
        .head(top_n)
    )

    plt.figure(figsize=(10, 7))

    corr.plot(kind="barh")

    plt.title(
        f"Top {top_n} Features Correlated with Failure",
        fontsize=13,
        fontweight="bold"
    )

    plt.xlabel("Correlation")
    plt.axvline(0, color="black", linewidth=0.8)

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    print("✅ Visualization module ready!")