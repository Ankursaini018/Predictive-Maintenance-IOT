import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import (
    StratifiedKFold,
    cross_val_score
)
from sklearn.metrics import (
    f1_score,
    make_scorer
)

import warnings
warnings.filterwarnings("ignore")

print("✅ Ablation Study Module Loaded")

import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.dirname(__file__)
    )
)

from preprocessing import (
    load_and_preprocess
)

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

print("✅ Project Modules Imported")

def create_feature_sets():

    print("=" * 50)
    print("CREATING FEATURE SETS")
    print("=" * 50)

    # IoT Only
    X_iot, y, feature_names, _ = (
        load_and_preprocess(
            'data/ai4i2020.csv'
        )
    )

    # Full Fusion
    fused_df = create_fused_dataset(
        'data/ai4i2020.csv'
    )

    X_full, y_full, full_features = (
        get_fused_arrays(
            fused_df
        )
    )

    weather_features = [
        'ambient_temp_c',
        'humidity_pct',
        'wind_speed_kmh',
        'air_pressure_hpa',
        'weather_encoded'
    ]

    load_features = [
        'factory_load',
        'load_encoded'
    ]

    weather_idx = [
        full_features.index(f)
        for f in weather_features
    ]

    load_idx = [
        full_features.index(f)
        for f in load_features
    ]

    iot_idx = [
        i for i, f
        in enumerate(full_features)
        if f not in (
            weather_features +
            load_features
        )
    ]

    X_weather = (
        X_full[
            :,
            iot_idx + weather_idx
        ]
    )

    X_load = (
        X_full[
            :,
            iot_idx + load_idx
        ]
    )

    experiments = {
        "IoT Only":
            (X_iot, y),

        "IoT + Weather":
            (X_weather, y_full),

        "IoT + Load":
            (X_load, y_full),

        "Full Context":
            (X_full, y_full)
    }

    return experiments

def evaluate_experiment(
    X,
    y,
    name
):

    skf = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    model = (
        RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1
        )
    )

    macro_f1 = make_scorer(
        f1_score,
        average='macro',
        zero_division=0
    )

    scores = cross_val_score(
        model,
        X,
        y,
        cv=skf,
        scoring=macro_f1,
        n_jobs=-1
    )

    result = {
        "Experiment":
            name,

        "Features":
            X.shape[1],

        "Macro F1":
            round(
                scores.mean(),
                4
            ),

        "Std":
            round(
                scores.std(),
                4
            )
    }

    return result

if __name__ == "__main__":

    experiments = (
        create_feature_sets()
    )

    results = []

    print("\n" + "=" * 50)
    print("RUNNING ABLATION STUDY")
    print("=" * 50)

    for name, (
        X,
        y
    ) in experiments.items():

        print(
            f"\nEvaluating {name}..."
        )

        result = (
            evaluate_experiment(
                X,
                y,
                name
            )
        )

        results.append(
            result
        )

        print(
            f"F1: "
            f"{result['Macro F1']}"
        )

    results_df = (
        pd.DataFrame(results)
    )

    print(
        "\n" + "=" * 50
    )

    print(
        "ABLATION RESULTS"
    )

    print(
        "=" * 50
    )

    print(
        results_df
    )

    # Save results

results_df.to_csv(
    'src/ablation_results.csv',
    index=False
)

print(
    "\n✅ Results saved to:"
)

print(
    "src/ablation_results.csv"
)

# Best model

best_idx = (
    results_df[
        'Macro F1'
    ].idxmax()
)

best = (
    results_df.loc[
        best_idx
    ]
)

print(
    "\n🏆 BEST MODEL:"
)

print(
    f"{best['Experiment']}"
)

print(
    f"F1 Score: "
    f"{best['Macro F1']}"
)