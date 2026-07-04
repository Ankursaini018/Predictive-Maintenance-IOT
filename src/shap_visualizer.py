"""
=========================================================
shap_visualizer.py
=========================================================

Project:
Predictive Maintenance using LightGBM

Week 3 - Day 3
Commit 2

Description
-----------
Creates professional visualizations from
SHAP feature importance generated in
shap_analyzer.py.
=========================================================
"""

import os
import warnings

warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# --------------------------------------------------------
# Paths
# --------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

RESULT_DIR = os.path.join(
    CURRENT_DIR,
    "tuning_results"
)

# --------------------------------------------------------
# Load SHAP Ranking
# --------------------------------------------------------

def load_shap_ranking():

    csv_path = os.path.join(

        RESULT_DIR,

        "shap_feature_ranking.csv"

    )

    if not os.path.exists(csv_path):

        raise FileNotFoundError(

            "Run shap_analyzer.py first."

        )

    df = pd.read_csv(csv_path)

    print("=" * 60)
    print("SHAP Feature Ranking Loaded")
    print("=" * 60)

    print(df.head())

    return df

# --------------------------------------------------------
# Feature Categories
# --------------------------------------------------------

def get_feature_category(feature):

    feature = feature.lower()

    if any(word in feature for word in [

        "air",

        "process",

        "temperature"

    ]):

        return "Temperature"

    elif any(word in feature for word in [

        "torque"

    ]):

        return "Torque"

    elif any(word in feature for word in [

        "speed",

        "rpm",

        "rotational"

    ]):

        return "Rotation"

    elif any(word in feature for word in [

        "wear"

    ]):

        return "Tool Wear"

    elif any(word in feature for word in [

        "type"

    ]):

        return "Machine Type"

    elif any(word in feature for word in [

        "humidity",

        "weather"

    ]):

        return "Weather"

    elif any(word in feature for word in [

        "shift"

    ]):

        return "Shift"

    else:

        return "Engineered"

# --------------------------------------------------------
# Add Category Column
# --------------------------------------------------------

def categorize_features(df):

    df["Category"] = df["Feature"].apply(

        get_feature_category

    )

    return df
# --------------------------------------------------------
# Top 20 SHAP Feature Importance
# --------------------------------------------------------

def plot_top_features(df, top_n=20):

    print("\nGenerating Top SHAP Feature Plot...")

    top_df = df.head(top_n)

    plt.figure(figsize=(10, 8))

    plt.barh(
        top_df["Feature"][::-1],
        top_df["Mean SHAP"][::-1]
    )

    plt.xlabel("Mean |SHAP Value|")
    plt.ylabel("Feature")
    plt.title(f"Top {top_n} SHAP Features")

    plt.tight_layout()

    output_path = os.path.join(
        RESULT_DIR,
        "top20_shap_features.png"
    )

    plt.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Saved: {output_path}")


# --------------------------------------------------------
# Category Contribution Pie Chart
# --------------------------------------------------------

def plot_category_distribution(df):

    print("\nGenerating Category Distribution...")

    category_df = (

        df.groupby("Category")["Mean SHAP"]

        .sum()

        .sort_values(ascending=False)

    )

    plt.figure(figsize=(8, 8))

    plt.pie(

        category_df,

        labels=category_df.index,

        autopct="%1.1f%%",

        startangle=90

    )

    plt.title("SHAP Feature Category Contribution")

    output_path = os.path.join(

        RESULT_DIR,

        "feature_category_distribution.png"

    )

    plt.tight_layout()

    plt.savefig(

        output_path,

        dpi=300,

        bbox_inches="tight"

    )

    plt.close()

    print(f"Saved: {output_path}")


# --------------------------------------------------------
# Histogram of Feature Importance
# --------------------------------------------------------

def plot_importance_histogram(df):

    print("\nGenerating Importance Histogram...")

    plt.figure(figsize=(10, 6))

    plt.hist(

        df["Mean SHAP"],

        bins=20,

        edgecolor="black"

    )

    plt.xlabel("Mean SHAP")

    plt.ylabel("Frequency")

    plt.title("Distribution of SHAP Feature Importance")

    output_path = os.path.join(

        RESULT_DIR,

        "feature_importance_histogram.png"

    )

    plt.tight_layout()

    plt.savefig(

        output_path,

        dpi=300,

        bbox_inches="tight"

    )

    plt.close()

    print(f"Saved: {output_path}")
    # --------------------------------------------------------
# Cumulative Feature Importance
# --------------------------------------------------------

def plot_cumulative_importance(df):

    print("\nGenerating Cumulative Feature Importance...")

    cumulative_df = df.copy()

    cumulative_df["Cumulative"] = (
        cumulative_df["Mean SHAP"].cumsum()
        / cumulative_df["Mean SHAP"].sum()
    ) * 100

    plt.figure(figsize=(10,6))

    plt.plot(
        range(1, len(cumulative_df)+1),
        cumulative_df["Cumulative"],
        marker="o",
        linewidth=2
    )

    plt.xlabel("Number of Features")
    plt.ylabel("Cumulative Importance (%)")
    plt.title("Cumulative SHAP Feature Importance")

    plt.grid(True)

    output_path = os.path.join(
        RESULT_DIR,
        "cumulative_feature_importance.png"
    )

    plt.tight_layout()

    plt.savefig(
        output_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Saved: {output_path}")


# --------------------------------------------------------
# Save Visualization Report
# --------------------------------------------------------

def save_visualization_report(df):

    report_path = os.path.join(
        RESULT_DIR,
        "shap_visualization_report.txt"
    )

    category_summary = (
        df.groupby("Category")["Mean SHAP"]
        .sum()
        .sort_values(ascending=False)
    )

    with open(report_path, "w") as f:

        f.write("="*60 + "\n")
        f.write("SHAP VISUALIZATION REPORT\n")
        f.write("="*60 + "\n\n")

        f.write("Top 20 Features\n")
        f.write("-"*30 + "\n")
        f.write(df.head(20).to_string(index=False))

        f.write("\n\n")

        f.write("Category Contribution\n")
        f.write("-"*30 + "\n")
        f.write(category_summary.to_string())

    print(f"\nSaved: {report_path}")


# --------------------------------------------------------
# Main Function
# --------------------------------------------------------

def main():

    print("="*70)
    print("SHAP VISUALIZATION DASHBOARD")
    print("="*70)

    df = load_shap_ranking()

    df = categorize_features(df)

    plot_top_features(df)

    plot_category_distribution(df)

    plot_importance_histogram(df)

    plot_cumulative_importance(df)

    save_visualization_report(df)

    print("\n" + "="*70)
    print("VISUALIZATION COMPLETED SUCCESSFULLY")
    print("="*70)

    print("\nGenerated Files:")

    print(f"✔ {os.path.join(RESULT_DIR,'top20_shap_features.png')}")
    print(f"✔ {os.path.join(RESULT_DIR,'feature_category_distribution.png')}")
    print(f"✔ {os.path.join(RESULT_DIR,'feature_importance_histogram.png')}")
    print(f"✔ {os.path.join(RESULT_DIR,'cumulative_feature_importance.png')}")
    print(f"✔ {os.path.join(RESULT_DIR,'shap_visualization_report.txt')}")


# --------------------------------------------------------
# Entry Point
# --------------------------------------------------------

if __name__ == "__main__":

    main()
