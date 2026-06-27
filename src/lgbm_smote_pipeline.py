"""
lgbm_smote_pipeline.py
======================
LightGBM + SMOTE inside 5-fold CV pipeline.

CRITICAL RULE:
SMOTE applied ONLY inside training folds
to prevent data leakage!

Infotact DS/ML Internship — Project 1
Week 3 : Imbalanced Classification
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    f1_score,
    roc_auc_score,
    precision_score,
    recall_score,
    confusion_matrix,
    classification_report
)
from imblearn.over_sampling import SMOTE
import lightgbm as lgb
import sys
sys.path.append('../')

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)


# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────

CV_CONFIG = {
    'n_splits'     : 5,
    'shuffle'      : True,
    'random_state' : 42
}

SMOTE_CONFIG = {
    'random_state'      : 42,
    'k_neighbors'       : 5,
    'sampling_strategy' : 'minority'
}

LGBM_CONFIG = {
    'objective'        : 'binary',
    'metric'           : 'binary_logloss',
    'boosting_type'    : 'gbdt',
    'num_leaves'       : 31,
    'learning_rate'    : 0.05,
    'feature_fraction' : 0.9,
    'bagging_fraction' : 0.8,
    'bagging_freq'     : 5,
    'verbose'          : -1,
    'random_state'     : 42,
    'n_estimators'     : 300,
    'class_weight'     : 'balanced'
}

TARGET_F1 = 0.85


# ─────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────

def run_lgbm_smote_cv(
        X: np.ndarray,
        y: np.ndarray,
        feature_names: list,
        verbose: bool = True) -> dict:
    """
    Run 5-fold CV with SMOTE inside
    training folds and LightGBM classifier.

    Parameters
    ----------
    X : np.ndarray
        Feature matrix.
    y : np.ndarray
        Target array.
    feature_names : list
        Feature names.
    verbose : bool
        Print fold results.

    Returns
    -------
    dict
        All metrics and fold results.
    """
    print("=" * 55)
    print("  LIGHTGBM + SMOTE — 5-FOLD CV")
    print("  SMOTE inside folds only (no leakage)")
    print("=" * 55)
    print(f"\n  Shape        : {X.shape}")
    print(f"  Class dist   : {Counter(y)}")
    print(f"  Failure rate : {y.mean()*100:.2f}%\n")

    skf   = StratifiedKFold(**CV_CONFIG)
    smote = SMOTE(**SMOTE_CONFIG)

    # Storage
    fold_f1        = []
    fold_auc       = []
    fold_precision = []
    fold_recall    = []
    fold_cms       = []
    all_y_true     = []
    all_y_pred     = []
    all_y_proba    = []
    trained_models = []

    for fold, (train_idx, test_idx) in enumerate(
        skf.split(X, y), 1
    ):
        # ── Split ──
        X_train = X[train_idx]
        X_test  = X[test_idx]
        y_train = y[train_idx]
        y_test  = y[test_idx]

        if verbose:
            print(f"  ── Fold {fold}/5 ──")
            print(f"  Train: {X_train.shape} "
                  f"| Failures: {y_train.sum()}")

        # ── SMOTE on train ONLY ──
        X_res, y_res = smote.fit_resample(
            X_train, y_train
        )
        if verbose:
            print(f"  After SMOTE: {X_res.shape} "
                  f"| Failures: {y_res.sum()}")

        # ── Train LightGBM ──
        model = lgb.LGBMClassifier(**LGBM_CONFIG)
        model.fit(
            X_res, y_res,
            eval_set=[(X_test, y_test)],
            callbacks=[
                lgb.early_stopping(30, verbose=False),
                lgb.log_evaluation(period=-1)
            ]
        )
        trained_models.append(model)

        # ── Evaluate ──
        y_pred  = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]

        f1  = f1_score(
            y_test, y_pred,
            average='macro',
            zero_division=0
        )
        auc = roc_auc_score(y_test, y_proba)
        pre = precision_score(
            y_test, y_pred,
            average='macro',
            zero_division=0
        )
        rec = recall_score(
            y_test, y_pred,
            average='macro',
            zero_division=0
        )
        cm = confusion_matrix(y_test, y_pred)

        fold_f1.append(f1)
        fold_auc.append(auc)
        fold_precision.append(pre)
        fold_recall.append(rec)
        fold_cms.append(cm)
        all_y_true.extend(y_test)
        all_y_pred.extend(y_pred)
        all_y_proba.extend(y_proba)

        if verbose:
            print(f"  Macro F1  : {f1:.4f}")
            print(f"  ROC AUC   : {auc:.4f}")
            print(f"  Precision : {pre:.4f}")
            print(f"  Recall    : {rec:.4f}\n")

    # ── Final Results ──
    results = {
        'fold_f1'        : fold_f1,
        'fold_auc'       : fold_auc,
        'fold_precision' : fold_precision,
        'fold_recall'    : fold_recall,
        'fold_cms'       : fold_cms,
        'mean_f1'        : np.mean(fold_f1),
        'std_f1'         : np.std(fold_f1),
        'mean_auc'       : np.mean(fold_auc),
        'std_auc'        : np.std(fold_auc),
        'mean_precision' : np.mean(fold_precision),
        'mean_recall'    : np.mean(fold_recall),
        'all_y_true'     : np.array(all_y_true),
        'all_y_pred'     : np.array(all_y_pred),
        'all_y_proba'    : np.array(all_y_proba),
        'trained_models' : trained_models,
        'feature_names'  : feature_names
    }

    # ── Summary ──
    achieved = results['mean_f1'] >= TARGET_F1
    print("=" * 55)
    print("  FINAL CV RESULTS")
    print("=" * 55)
    print(f"  Macro F1  : {results['mean_f1']:.4f}"
          f" ± {results['std_f1']:.4f}")
    print(f"  ROC AUC   : {results['mean_auc']:.4f}"
          f" ± {results['std_auc']:.4f}")
    print(f"  Precision : {results['mean_precision']:.4f}")
    print(f"  Recall    : {results['mean_recall']:.4f}")
    print(f"\n  Target F1 : {TARGET_F1}")
    if achieved:
        print(f"  ✅ TARGET ACHIEVED!")
    else:
        gap = TARGET_F1 - results['mean_f1']
        print(f"  ⚠️  Gap: {gap:.4f} → tune next!")
    print("=" * 55)

    # ── Classification Report ──
    print("\n  Classification Report:")
    print(classification_report(
        results['all_y_true'],
        results['all_y_pred'],
        target_names=['No Failure', 'Failure'],
        zero_division=0
    ))

    return results


if __name__ == "__main__":

    print("=" * 55)
    print("Loading fused dataset...")
    print("=" * 55)

    fused_df = create_fused_dataset(
        "data/ai4i2020.csv"
    )

    X, y, feature_names = get_fused_arrays(
        fused_df
    )

    results = run_lgbm_smote_cv(
        X,
        y,
        feature_names
    )