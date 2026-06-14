"""
Model Validation Utilities
--------------------------
Contains helper functions for:
1. Train-test split
2. Cross-validation
3. Model evaluation metrics
"""

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
)


def split_data(X, y, test_size=0.2, random_state=42):
    """
    Split dataset into train and test sets.

    Args:
        X: Features
        y: Target
        test_size (float): Test split ratio
        random_state (int): Seed value

    Returns:
        X_train, X_test, y_train, y_test
    """
    return train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )


def evaluate_model(model, X_test, y_test):
    """
    Evaluate classification model.

    Args:
        model: Trained ML model
        X_test: Test features
        y_test: True labels
    """
    y_pred = model.predict(X_test)

    print("\n=== MODEL PERFORMANCE ===")
    print(f"Accuracy : {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"Recall   : {recall_score(y_test, y_pred):.4f}")
    print(f"F1 Score : {f1_score(y_test, y_pred):.4f}")

    print("\n=== Classification Report ===")
    print(classification_report(y_test, y_pred))


def run_cross_validation(model, X, y, cv=5):
    """
    Run cross-validation.

    Args:
        model: ML model
        X: Features
        y: Labels
        cv (int): Number of folds
    """
    scores = cross_val_score(
        model,
        X,
        y,
        cv=cv,
        scoring="f1"
    )

    print("\n=== Cross Validation Results ===")
    print(f"F1 Scores: {scores}")
    print(f"Mean F1 Score: {scores.mean():.4f}")


if __name__ == "__main__":
    print("✅ Model validator ready!")