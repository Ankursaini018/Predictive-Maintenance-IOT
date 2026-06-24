import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import (
    StratifiedKFold,
    cross_val_score
)
from sklearn.metrics import make_scorer, f1_score

from correlation_analysis import load_fused_dataset
from feature_selector import (
    prepare_features,
    variance_filter,
    correlation_filter
)


def get_selected_dataset(
    top_n=25
):
    """
    Build optimized dataset.
    """

    df = load_fused_dataset()

    X, y = prepare_features(df)

    X_var, _ = variance_filter(X)

    X_corr = correlation_filter(X_var)

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_corr,
        y
    )

    importance = pd.DataFrame({
        "Feature": X_corr.columns,
        "Importance": model.feature_importances_
    })

    importance = importance.sort_values(
        by="Importance",
        ascending=False
    )

    selected_features = (
        importance
        .head(top_n)
        ["Feature"]
        .tolist()
    )

    return (
        X_corr[selected_features],
        y,
        selected_features
    )


def evaluate_pipeline(
    X,
    y,
    name
):
    """
    Evaluate pipeline.
    """

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        n_jobs=-1
    )

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    scorer = make_scorer(
        f1_score
    )

    scores = cross_val_score(
        model,
        X,
        y,
        cv=cv,
        scoring=scorer,
        n_jobs=-1
    )

    print(f"\n{name}")
    print("-" * 40)
    print(
        f"Mean F1: {scores.mean():.4f}"
    )
    print(
        f"Std F1 : {scores.std():.4f}"
    )

    return scores


def create_comparison_plot(
    full_scores,
    selected_scores
):
    """
    Plot comparison.
    """

    plt.figure(
        figsize=(8, 5)
    )

    plt.boxplot(
        [
            full_scores,
            selected_scores
        ],
        labels=[
            "Full",
            "Selected"
        ]
    )

    plt.ylabel("F1 Score")

    plt.title(
        "Pipeline Comparison"
    )

    save_path = os.path.join(
        os.path.dirname(__file__),
        "pipeline_comparison.png"
    )

    plt.tight_layout()

    plt.savefig(save_path)

    plt.show()

    print(
        f"Saved: {save_path}"
    )


if __name__ == "__main__":

    df = load_fused_dataset()

    X_full, y = prepare_features(df)

    print(
        f"\nFull Feature Count: {X_full.shape[1]}"
    )

    full_scores = evaluate_pipeline(
        X_full,
        y,
        "FULL PIPELINE"
    )

    (
        X_selected,
        y_selected,
        selected_features
    ) = get_selected_dataset()

    print(
        f"\nSelected Feature Count: {len(selected_features)}"
    )

    selected_scores = evaluate_pipeline(
        X_selected,
        y_selected,
        "OPTIMIZED PIPELINE"
    )

    create_comparison_plot(
        full_scores,
        selected_scores
    )

    improvement = (
        selected_scores.mean()
        - full_scores.mean()
    )

    print(
        f"\nF1 Improvement: {improvement:.4f}"
    )