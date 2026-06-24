import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.feature_selection import VarianceThreshold
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from correlation_analysis import load_fused_dataset


def prepare_features(df):
    """
    Prepare feature matrix and target.
    """

    target_column = "Machine failure"

    drop_columns = [
        "UDI",
        "Product ID",
        "Type"
    ]

    existing_drop = [
        col for col in drop_columns
        if col in df.columns
    ]

    X = df.drop(
        columns=existing_drop + [target_column]
    )

    y = df[target_column]

    return X, y


def variance_filter(
    X,
    threshold=0.01
):
    """
    Remove low variance features.
    """

    selector = VarianceThreshold(
        threshold=threshold
    )

    X_filtered = selector.fit_transform(X)

    selected_features = (
        X.columns[
            selector.get_support()
        ]
        .tolist()
    )

    return (
        pd.DataFrame(
            X_filtered,
            columns=selected_features
        ),
        selected_features
    )


def correlation_filter(
    X,
    threshold=0.95
):
    """
    Remove highly correlated features.
    """

    corr_matrix = X.corr().abs()

    upper = corr_matrix.where(
        np.triu(
            np.ones(
                corr_matrix.shape
            ),
            k=1
        ).astype(bool)
    )

    to_drop = [
        column
        for column in upper.columns
        if any(
            upper[column] > threshold
        )
    ]

    X_filtered = X.drop(
        columns=to_drop
    )

    return X_filtered


def feature_importance_selection(
    X,
    y,
    top_n=25
):
    """
    Select top features using RF importance.
    """

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y
        )
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        n_jobs=-1
    )

    model.fit(
        X_train,
        y_train
    )

    importance = pd.DataFrame({
        "Feature": X.columns,
        "Importance": model.feature_importances_
    })

    importance = (
        importance
        .sort_values(
            by="Importance",
            ascending=False
        )
    )

    selected_features = (
        importance
        .head(top_n)
        ["Feature"]
        .tolist()
    )

    plt.figure(
        figsize=(10, 8)
    )

    plt.barh(
        importance.head(top_n)["Feature"][::-1],
        importance.head(top_n)["Importance"][::-1]
    )

    plt.title(
        "Top Feature Importances"
    )

    plt.tight_layout()

    save_path = os.path.join(
        os.path.dirname(__file__),
        "feature_importance.png"
    )

    plt.savefig(save_path)

    plt.show()

    return selected_features


def save_feature_list(
    selected_features
):
    """
    Save selected feature names.
    """

    output_path = os.path.join(
        os.path.dirname(__file__),
        "selected_features.txt"
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        for feature in selected_features:
            file.write(
                feature + "\n"
            )

    print(
        f"Saved: {output_path}"
    )


if __name__ == "__main__":

    df = load_fused_dataset()

    X, y = prepare_features(df)

    print(
        f"\nInitial Features: {X.shape[1]}"
    )

    X_var, _ = variance_filter(X)

    print(
        f"After Variance Filter: {X_var.shape[1]}"
    )

    X_corr = correlation_filter(
        X_var
    )

    print(
        f"After Correlation Filter: {X_corr.shape[1]}"
    )

    selected_features = (
        feature_importance_selection(
            X_corr,
            y,
            top_n=25
        )
    )

    print(
        f"Selected Features: {len(selected_features)}"
    )

    save_feature_list(
        selected_features
    )

    print("\nTop Features:")

    for feature in selected_features:
        print(feature)