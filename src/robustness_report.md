# Week 4 - Day 1

# Noise Robustness Report

---

## Project Information

| Item | Details |
|------|---------|
| Project | Predictive Maintenance using IoT + Machine Learning |
| Week | Week 4 |
| Day | Day 1 |
| Focus | Model Robustness Evaluation |
| Status | ✅ Completed |

---

# Objective

The objective of this experiment was to evaluate the robustness of the trained LightGBM model against different types of synthetic sensor noise.

The experiment helps determine how stable the predictive maintenance model remains under imperfect real-world sensor conditions.

---

# Noise Types Evaluated

The following synthetic noise types were applied to the test dataset.

| Noise Type | Description |
|------------|-------------|
| Gaussian | Random measurement noise |
| Missing Values | Random sensor value replacement |
| Drift | Gradual sensor degradation over time |
| Spike | Sudden abnormal sensor readings |
| Scaling | Sensor calibration error |

---

# Experimental Procedure

The following workflow was used.

```
Original Dataset
        │
        ▼
Feature Engineering
        │
        ▼
Data Fusion
        │
        ▼
Train Final LightGBM Model
        │
        ▼
Inject Synthetic Noise
        │
        ▼
Generate Predictions
        │
        ▼
Compute Macro F1
        │
        ▼
Compare Performance
```

---

# Evaluation Metric

Primary Metric

- Macro F1 Score

Additional Analysis

- Performance Drop
- Average Robustness
- Worst Case Performance

---

# Files Generated

## Python Modules

```
src/

noise_injector.py

robustness_tester.py
```

---

## Notebook

```
notebooks/

week4_day1_noise_analysis.ipynb
```

---

## Results

```
src/tuning_results/

robustness_curves.png

robustness_results.csv

robustness_summary.csv
```

---

# Key Observations

The robustness experiment demonstrated that the trained LightGBM model maintains good predictive performance under moderate levels of synthetic noise.

Performance gradually decreases as noise intensity increases, which is expected in practical industrial environments.

Different noise types affect the model differently, highlighting the importance of testing multiple corruption scenarios during model validation.

---

# Practical Importance

Robustness testing is essential because industrial IoT sensors are rarely perfect.

Potential real-world issues include:

- Sensor drift
- Temporary sensor failure
- Calibration errors
- Electrical interference
- Environmental disturbances

Testing robustness provides confidence that the predictive maintenance system can continue making useful predictions despite noisy sensor inputs.

---

# Conclusion

The robustness evaluation confirms that the predictive maintenance model is resilient to multiple forms of synthetic noise.

The generated robustness curves and summary statistics provide valuable insight into the model's behavior under challenging operating conditions.

These findings strengthen confidence in the model before deployment and provide a solid foundation for the final optimization tasks in Week 4.

---

# Next Steps

Week 4 Day 2 will focus on:

- Decision Threshold Optimization
- Precision–Recall Analysis
- Threshold Selection
- Business-Oriented Evaluation

---

**Status:** ✅ Week 4 Day 1 Completed Successfully
