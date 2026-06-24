## Week 1 — IoT Telemetry Ingestion & Signal Processing ✅ COMPLETE

### What We Built

| Category | Features | Count |
|---|---|---|
| Raw Sensor | Temperature, RPM, Torque, Tool Wear | 5 |
| Rolling | Mean, Std, Variance (window=10) | 15 |
| Domain | Power, Temp Delta, Wear Rate | 6 |
| Lag | Lag1, Lag2, Lag3 for key sensors | 12 |
| Rate of Change | ROC, Absolute ROC | 6 |
| Outlier Flags | Z-score flags + anomaly score | 6 |
| **TOTAL** | | **50+** |

---

### Notebooks

| Notebook | Focus |
|---|---|
| `week1_eda_signal_processing.ipynb` | Dataset ingestion + rolling features |
| `week1_day2_signal_analysis.ipynb` | Signal analysis + failure breakdown |
| `week1_day3_feature_engineering.ipynb` | Domain features |
| `week1_day4_final_signal_processing.ipynb` | Lag + ROC + outlier features |
| `week1_day6_eda_summary.ipynb` | EDA summary |
| `week1_day7_final_summary.ipynb` | Week 1 final wrap up |

---

### Source Scripts

| Script | Purpose |
|---|---|
| `preprocessing.py` | Full feature engineering pipeline |
| `visualizations.py` | Reusable plotting functions |
| `data_validator.py` | Dataset quality checks |
| `test_preprocessing.py` | Unit tests |
| `model_validator.py` | Model evaluation utilities |

---

## Week 2 — Contextual Data Fusion 🔄 IN PROGRESS

### Planned Tasks
- Simulate external weather and load context data
- Merge IoT sensor data with external signals
- Conduct ablation study
- Build final enriched feature pipeline

## Week 2 — Contextual Data Fusion ✅ Day 1 & Day 2 Complete

### External Context Features Added

| Feature Category   | Features                                                                        |
| ------------------ | ------------------------------------------------------------------------------- |
| Weather            | ambient_temp_c, humidity_pct, wind_speed_kmh, air_pressure_hpa, weather_encoded |
| Factory Operations | factory_load, load_encoded                                                      |

### Data Fusion Pipeline

The IoT telemetry dataset was enriched with simulated external contextual signals:

* Weather simulation engine
* Factory load simulation engine
* Context-aware data fusion pipeline
* Shift-based operational analysis
* External feature importance analysis

### New Notebooks

| Notebook                         | Purpose                       |
| -------------------------------- | ----------------------------- |
| week2_day1_data_fusion.ipynb     | IoT + external context fusion |
| week2_day2_fusion_analysis.ipynb | Deep contextual analysis      |

### New Scripts

| Script                         | Purpose                           |
| ------------------------------ | --------------------------------- |
| weather_simulator.py           | Weather condition simulation      |
| load_simulator.py              | Factory load simulation           |
| data_fusion.py                 | Context fusion pipeline           |
| shift_analysis.py              | Shift-wise maintenance analysis   |
| external_feature_importance.py | Context feature correlation study |

### Generated Visualizations

* failure_by_weather.png
* failure_by_shift.png
* context_scatter_analysis.png
* weekday_vs_weekend_failure.png
* shift_sensor_analysis.png
* external_feature_importance.png

### Current Dataset Status

| Metric            | Value |
| ----------------- | ----- |
| Base IoT Features | 50    |
| External Features | 7     |
| Total Features    | 57    |
| Dataset Rows      | 9,991 |
| Failure Rate      | 3.39% |



## Week 2 Day 3 — Ablation Study ✅

### Experiments

* IoT Only
* IoT + Weather
* IoT + Load
* Full Context Fusion

### Evaluation

Random Forest classifier was used to compare feature groups.

### Findings

* Contextual features improved Macro F1 score.
* Full Context Fusion achieved the best performance.
* External information contributes meaningful predictive value.

### Deliverables

* ablation_study.py
* week2_day3_ablation_study.ipynb
* ablation_results.csv
* ablation_f1_comparison.png
* ablation_report.txt

## Week 2 Day 4 — Fusion Visualization & Analysis

### Objectives

* Analyze relationships between IoT sensor signals and contextual features.
* Investigate feature interactions associated with machine failures.
* Generate dataset profiling reports for the fused dataset.

### Deliverables

#### Notebook

* `week2_day4_fusion_visualization.ipynb`

#### Scripts

* `correlation_analysis.py`
* `interaction_plots.py`
* `dataset_profiler.py`

### Generated Outputs

* Correlation Matrix
* Correlation Report
* Interaction Plots
* Feature Boxplots
* Dataset Profile Report

### Key Findings

* Rolling variance features show strong association with failures.
* Tool wear related features remain highly informative.
* Engineered interaction features contribute meaningful predictive signals.
* Fused dataset contains 9,991 observations and 51 columns after preprocessing.

### Status

✅ Week 2 Day 4 Complete
