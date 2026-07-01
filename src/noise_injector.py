"""
=========================================================
noise_injector.py
=========================================================

Project:
Predictive Maintenance using LightGBM

Week 4 - Day 1
Commit 1

Description
-----------
Inject synthetic noise into feature data
to evaluate model robustness.

Noise Types
-----------
1. Gaussian Noise
2. Missing Values
3. Sensor Drift
4. Spike Noise
5. Scaling Noise
=========================================================
"""

import os
import sys
import warnings

warnings.filterwarnings("ignore")

# ------------------------------------------------------
# Project Paths
# ------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ------------------------------------------------------
# Libraries
# ------------------------------------------------------

import numpy as np
import matplotlib.pyplot as plt

from external_data.data_fusion import (
    create_fused_dataset,
    get_fused_arrays
)

# ------------------------------------------------------
# Gaussian Noise
# ------------------------------------------------------

def add_gaussian_noise(
    X,
    noise_level=0.10,
    random_state=42
):

    """
    Add Gaussian noise to every feature.
    """

    rng = np.random.default_rng(random_state)

    X = X.astype(float).copy()

    feature_std = np.std(X, axis=0)

    noise = rng.normal(

        loc=0,

        scale=noise_level * feature_std,

        size=X.shape

    )

    return X + noise


# ------------------------------------------------------
# Missing Values
# ------------------------------------------------------

def add_missing_values(
    X,
    missing_rate=0.05,
    random_state=42
):

    """
    Simulate missing values by replacing
    random cells with column mean.
    """

    rng = np.random.default_rng(random_state)

    X_missing = X.astype(float).copy()

    mask = rng.random(X.shape) < missing_rate

    column_means = np.mean(X_missing, axis=0)

    for col in range(X.shape[1]):

        X_missing[

            mask[:, col],

            col

        ] = column_means[col]

    return X_missing
# ------------------------------------------------------
# Sensor Drift
# ------------------------------------------------------

def add_sensor_drift(
    X,
    drift_rate=0.05
):

    """
    Simulate gradual sensor drift.
    """

    X_drift = X.astype(float).copy()

    n_rows = X.shape[0]

    drift = np.linspace(
        0,
        drift_rate,
        n_rows
    )

    for col in range(X.shape[1]):

        std = np.std(X[:, col])

        X_drift[:, col] += drift * std

    return X_drift


# ------------------------------------------------------
# Spike Noise
# ------------------------------------------------------

def add_spike_noise(
    X,
    spike_rate=0.02,
    spike_magnitude=5,
    random_state=42
):

    """
    Simulate sudden sensor spikes.
    """

    rng = np.random.default_rng(random_state)

    X_spike = X.astype(float).copy()

    mask = rng.random(X.shape) < spike_rate

    feature_std = np.std(X, axis=0)

    for col in range(X.shape[1]):

        spike_count = np.sum(mask[:, col])

        if spike_count == 0:
            continue

        spikes = (

            rng.choice(
                [-1, 1],
                size=spike_count
            )

            * spike_magnitude

            * feature_std[col]

        )

        X_spike[
            mask[:, col],
            col
        ] += spikes

    return X_spike


# ------------------------------------------------------
# Scaling Noise
# ------------------------------------------------------

def add_scaling_noise(
    X,
    scale_range=0.10,
    random_state=42
):

    """
    Simulate calibration errors
    by scaling each feature.
    """

    rng = np.random.default_rng(random_state)

    factors = rng.uniform(

        1 - scale_range,

        1 + scale_range,

        X.shape[1]

    )

    return X.astype(float) * factors


# ------------------------------------------------------
# Unified Noise Interface
# ------------------------------------------------------

def apply_noise(
    X,
    noise_type="gaussian",
    noise_level=0.10
):

    """
    Apply one of the supported
    synthetic noise types.
    """

    noise_functions = {

        "gaussian": lambda x:
            add_gaussian_noise(
                x,
                noise_level=noise_level
            ),

        "missing": lambda x:
            add_missing_values(
                x,
                missing_rate=noise_level
            ),

        "drift": lambda x:
            add_sensor_drift(
                x,
                drift_rate=noise_level
            ),

        "spike": lambda x:
            add_spike_noise(
                x,
                spike_rate=noise_level
            ),

        "scaling": lambda x:
            add_scaling_noise(
                x,
                scale_range=noise_level
            )

    }

    if noise_type not in noise_functions:

        raise ValueError(

            f"Unknown noise type: {noise_type}\n"

            f"Choose from: "

            f"{list(noise_functions.keys())}"

        )

    return noise_functions[noise_type](X)
# ------------------------------------------------------
# Visualize Noise Effect
# ------------------------------------------------------

def visualize_noise_effect(
    X,
    feature_names,
    feature_index=0,
    noise_level=0.10,
    save_path=None
):

    """
    Visualize how each noise type affects
    a selected feature.
    """

    noise_types = [
        "gaussian",
        "missing",
        "drift",
        "spike",
        "scaling"
    ]

    colors = [
        "red",
        "orange",
        "green",
        "purple",
        "brown"
    ]

    samples = min(200, X.shape[0])

    fig, axes = plt.subplots(
        3,
        2,
        figsize=(15, 10)
    )

    axes = axes.flatten()

    # Clean signal
    axes[0].plot(
        X[:samples, feature_index],
        linewidth=1.5,
        label="Clean"
    )

    axes[0].set_title(
        f"Clean Signal\n{feature_names[feature_index]}"
    )

    axes[0].legend()

    # Noisy signals
    for i, noise in enumerate(noise_types):

        X_noisy = apply_noise(
            X,
            noise_type=noise,
            noise_level=noise_level
        )

        axes[i + 1].plot(
            X[:samples, feature_index],
            alpha=0.5,
            label="Clean"
        )

        axes[i + 1].plot(
            X_noisy[:samples, feature_index],
            color=colors[i],
            linewidth=1,
            label=noise.capitalize()
        )

        axes[i + 1].set_title(
            noise.capitalize()
        )

        axes[i + 1].legend(fontsize=8)

    plt.suptitle(
        "Synthetic Noise Injection Comparison",
        fontsize=14,
        fontweight="bold"
    )

    plt.tight_layout()

    if save_path is None:

        save_path = os.path.join(
            CURRENT_DIR,
            "tuning_results",
            "noise_effect_visualization.png"
        )

    os.makedirs(
        os.path.dirname(save_path),
        exist_ok=True
    )

    plt.savefig(
        save_path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.show()

    print(f"\nVisualization saved:\n{save_path}")


# ------------------------------------------------------
# Load Dataset
# ------------------------------------------------------

def load_dataset():

    print("=" * 60)
    print("Loading Dataset")
    print("=" * 60)

    dataset = create_fused_dataset(
        os.path.join(
            PROJECT_ROOT,
            "data",
            "ai4i2020.csv"
        )
    )

    X, y, feature_names = get_fused_arrays(
        dataset
    )

    print(f"Dataset Shape : {X.shape}")
    print(f"Features      : {len(feature_names)}")

    return X, y, feature_names


# ------------------------------------------------------
# Main Function
# ------------------------------------------------------

def main():

    X, y, feature_names = load_dataset()

    print("\nTesting Noise Injection...\n")

    noise_types = [
        "gaussian",
        "missing",
        "drift",
        "spike",
        "scaling"
    ]

    for noise in noise_types:

        X_noisy = apply_noise(
            X,
            noise_type=noise,
            noise_level=0.10
        )

        print(
            f"{noise:<10} "
            f"Shape: {X_noisy.shape}"
        )

    print("\nGenerating Visualization...\n")

    visualize_noise_effect(
        X,
        feature_names,
        feature_index=0
    )

    print("\nNoise Injection Pipeline Ready.")


# ------------------------------------------------------
# Entry Point
# ------------------------------------------------------

if __name__ == "__main__":

    main()
    