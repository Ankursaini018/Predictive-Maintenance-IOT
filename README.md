# 🔧 Predictive Maintenance IoT (Contextual Edge AI)

![Progress](https://img.shields.io/badge/Progress-Week%202%20Complete-success)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-ML-orange)
![Status](https://img.shields.io/badge/Status-Mid%20Review%20Ready-brightgreen)
![Internship](https://img.shields.io/badge/Infotact-DS%2FML%20Internship-purple)


> **Infotact DS/ML Internship – Project 1**

A machine learning pipeline for **predictive maintenance** using the **AI4I 2020 Predictive Maintenance Dataset**, enhanced with **simulated contextual information** such as weather and factory load to improve failure prediction.

---

# 📌 Project Overview

The objective of this project is to predict machine failures before they occur by combining:

- IoT sensor telemetry
- Engineered statistical features
- Simulated weather conditions
- Simulated factory load information

The project follows a modular pipeline consisting of preprocessing, feature engineering, contextual data fusion, visualization, feature selection and model optimization.

---

# 🛠️ Tech Stack

| Category | Technologies |
|-----------|--------------|
| Language | Python 3.11 |
| Data Processing | Pandas, NumPy |
| Machine Learning | Scikit-Learn |
| Visualization | Matplotlib, Seaborn |
| Notebook | Jupyter |
| Version Control | Git & GitHub |

---

# 📂 Repository Structure

```text
Predictive-Maintenance-IOT/
│
├── data/
├── models/
├── notebooks/
├── src/
│   ├── external_data/
│   ├── preprocessing.py
│   ├── feature_selector.py
│   ├── pipeline_optimizer.py
│   ├── correlation_analysis.py
│   ├── interaction_plots.py
│   ├── dataset_profiler.py
│   └── utils.py
│
├── README.md
└── requirements.txt
```

---

# ✅ Week 1 Progress

### Data Exploration
- Exploratory Data Analysis
- Dataset validation
- Missing value analysis

### Feature Engineering
- Rolling statistics
- Lag features
- Rate-of-change features
- Domain-specific features
- Outlier detection

### Deliverables
- Complete preprocessing pipeline
- Reusable visualization utilities
- Dataset validation scripts

---

# ✅ Week 2 Progress

### Day 1
- Contextual weather simulation
- Factory load simulation
- Data fusion pipeline

### Day 2
- Context feature analysis
- Shift analysis
- Feature importance study

### Day 3
- Ablation study
- IoT vs Context comparison
- Performance analysis

### Day 4
- Correlation analysis
- Interaction plots
- Dataset profiling

### Day 5
- Feature selection
- Pipeline optimization
- Feature validation

### Day 6
- Project refactoring
- Package initialization
- Utility module
- Documentation improvements

---
## Week 3 — LightGBM + SMOTE Modeling 🔄 IN PROGRESS

### Model Configuration
| Parameter | Value |
|---|---|
| Algorithm | LightGBM (GBDT) |
| CV Strategy | 5-Fold Stratified |
| Imbalance | SMOTE inside folds only |
| Num Leaves | 31 |
| Learning Rate | 0.05 |
| N Estimators | 300 |
| Class Weight | Balanced |

### Results (Day 1 Baseline)
| Metric | Score |
|---|---|
| Macro F1 | In progress |
| ROC AUC | In progress |
| Precision | In progress |
| Recall | In progress |
| Target F1 | ≥ 0.85 |

### Week 3 Source Scripts
| Script | Purpose |
|---|---|
| lgbm_smote_pipeline.py | SMOTE + LightGBM CV |
| results_visualizer.py | ROC PR curve plots |
| model_evaluator.py | Full evaluation pipeline |

---

# Week 3 — Day 2 : Hyperparameter Optimization & Final Model Training ✅

## Objective
Improve the LightGBM model by tuning hyperparameters using both Grid Search and Bayesian Optimization (Optuna), then train the final production-ready model using the best configuration.

---

## Commit 1 — Focused Grid Search

### Implemented
- Built a focused Grid Search pipeline for LightGBM.
- Evaluated multiple hyperparameter combinations.
- Used 5-Fold Stratified Cross Validation.
- Applied SMOTE only on training folds to prevent data leakage.
- Selected the best configuration using Macro F1 Score.

### Output Files
- `grid_search_results.csv`
- `best_parameters.json`

---

## Commit 2 — Optuna Hyperparameter Optimization

### Implemented
- Integrated Optuna Bayesian Optimization.
- Automated hyperparameter tuning.
- Optimized:
  - num_leaves
  - learning_rate
  - n_estimators
  - min_child_samples
  - feature_fraction
  - bagging_fraction
  - reg_alpha
  - reg_lambda

### Generated Files
- `optuna_best_parameters.json`
- `optuna_trial_history.csv`
- `optimization_history.png`
- `parameter_importance.png`

---

## Commit 3 — Hyperparameter Tuning Notebook

Created an interactive Jupyter Notebook demonstrating:

- Grid Search workflow
- Hyperparameter comparison
- Optuna optimization results
- Visualization of tuning history
- Final observations

Notebook:

```
notebooks/week3_day2_hyperparameter_tuning.ipynb
```

---

## Commit 4 — Final Tuned Model

Implemented a production-ready training pipeline.

### Features

- Loads best Optuna parameters
- Uses 5-Fold Stratified Cross Validation
- Applies SMOTE inside training folds
- Trains final LightGBM model
- Computes:
  - Macro F1
  - ROC AUC
  - Precision
  - Recall
- Generates Classification Report
- Saves trained model summary

### Generated Files

```
models/
└── best_lightgbm_model.pkl

src/tuning_results/
└── best_model_summary.txt
```

---

## Performance Summary

| Metric | Result |
|---------|---------|
| Algorithm | LightGBM |
| Validation | Stratified 5-Fold CV |
| Sampling | SMOTE |
| Hyperparameter Search | Grid Search + Optuna |
| Evaluation Metric | Macro F1 |
| Best Macro F1 | ~0.93 |
| Target Achieved | ✅ |

---

## Skills Practiced

- Hyperparameter Tuning
- Bayesian Optimization
- Optuna
- Grid Search
- Cross Validation
- SMOTE
- Model Evaluation
- LightGBM
- Model Serialization
- Machine Learning Pipeline Design

---

## Week 3 Day 2 Status

✅ Completed Successfully

---

# Week 3 — Day 3 : SHAP Explainability & Feature Importance ✅

## Objective

Improve the interpretability of the final LightGBM model by analyzing feature importance using SHAP (SHapley Additive Explanations). This helps explain *why* the model predicts machine failures and increases model transparency.

---

## Commit 1 — SHAP Analysis Pipeline

### Implemented

- Created `shap_analyzer.py`
- Loaded the final tuned LightGBM model
- Computed SHAP values
- Generated global and local feature explanations

### Generated Files

- `shap_summary_plot.png`
- `shap_feature_importance.png`
- `shap_waterfall_plot.png`
- `shap_feature_ranking.csv`
- `shap_analysis_report.txt`

---

## Commit 2 — SHAP Visualization Dashboard

### Implemented

Created additional visualization utilities for SHAP analysis:

- Top 20 Feature Importance
- Feature Category Distribution
- Cumulative Feature Importance
- Feature Importance Histogram

### Generated Files

- `top20_shap_features.png`
- `feature_category_distribution.png`
- `feature_importance_histogram.png`
- `cumulative_feature_importance.png`
- `shap_visualization_report.txt`

---

## Commit 3 — SHAP Analysis Notebook

Created an interactive Jupyter Notebook demonstrating:

- Loading SHAP results
- Feature ranking analysis
- Category-wise importance
- Visualization dashboard
- Interpretation of model behavior

Notebook:

```text
notebooks/week3_day3_shap_analysis.ipynb
```

---

## Commit 4 — SHAP Findings Report

Prepared a detailed explainability report including:

- Methodology
- Feature importance analysis
- Category contribution
- Model transparency
- Practical findings

Report:

```text
src/tuning_results/shap_findings_report.md
```

---

## Key Findings

- SHAP identified the most influential features driving machine failure prediction.
- Engineered features significantly improved predictive performance.
- Temperature, torque, rotational speed, and tool wear were among the most important feature groups.
- SHAP provided both global and local explanations, improving model transparency.

---

## Skills Practiced

- Explainable AI (XAI)
- SHAP
- Feature Importance Analysis
- Model Interpretability
- Data Visualization
- LightGBM Explainability
- Feature Engineering Evaluation

---

## Output Files

```text
src/
├── shap_analyzer.py
├── shap_visualizer.py

src/tuning_results/
├── shap_summary_plot.png
├── shap_feature_importance.png
├── shap_waterfall_plot.png
├── shap_feature_ranking.csv
├── top20_shap_features.png
├── feature_category_distribution.png
├── feature_importance_histogram.png
├── cumulative_feature_importance.png
├── shap_analysis_report.txt
├── shap_visualization_report.txt
└── shap_findings_report.md

notebooks/
└── week3_day3_shap_analysis.ipynb
```

---

## Week 3 Day 3 Status

✅ Completed Successfully
---

# Week 3 — Final Model Development & Evaluation ✅ COMPLETE

## Overview

Week 3 focused on transforming the predictive maintenance project into a production-ready machine learning pipeline by combining:

- LightGBM Classification
- SMOTE for Class Imbalance
- Hyperparameter Optimization
- SHAP Explainability
- Final Model Evaluation
- Model Persistence
- Reproducible Training Pipeline

---

# Week 3 Progress

| Day | Focus | Status |
|------|-------|--------|
| Day 1 | LightGBM + SMOTE | ✅ |
| Day 2 | Hyperparameter Optimization | ✅ |
| Day 3 | SHAP Explainability | ✅ |
| Day 4 | Final Evaluation & Model Persistence | ✅ |

---

# Final Pipeline

```
Dataset
        │
        ▼
Feature Engineering
        │
        ▼
Data Fusion
        │
        ▼
SMOTE (Training Folds Only)
        │
        ▼
LightGBM
        │
        ▼
Optuna Hyperparameter Tuning
        │
        ▼
SHAP Explainability
        │
        ▼
Final Evaluation
        │
        ▼
Saved Model + Metadata
```

---

# Week 3 Deliverables

## Python Modules

```
src/

lgbm_smote_pipeline.py

hyperparameter_tuner.py

optuna_tuner.py

best_model_trainer.py

shap_analyzer.py

shap_visualizer.py

final_model_pipeline.py

model_saver.py
```

---

## Jupyter Notebooks

```
notebooks/

week3_day1_lgbm_training.ipynb

week3_day2_hyperparameter_tuning.ipynb

week3_day3_shap_analysis.ipynb

week3_day4_final_evaluation.ipynb
```

---

## Reports

```
docs/

week3_completion_report.md

src/

model_metadata.json

reproduction_guide.txt

tuning_results/
```

---

# Techniques Used

- LightGBM
- SMOTE
- Stratified 5-Fold Cross Validation
- Grid Search
- Optuna
- SHAP Explainability
- Model Evaluation
- ROC-AUC
- Precision–Recall Analysis
- Confusion Matrix
- Feature Importance
- Model Serialization
- Reproducible Machine Learning

---

# Week 3 Outcomes

- Successfully addressed class imbalance using SMOTE.
- Tuned LightGBM using Grid Search and Optuna.
- Built reusable training and evaluation pipelines.
- Added explainability using SHAP.
- Created reusable notebooks for experimentation.
- Saved model metadata and reproduction guide.
- Prepared the project for final optimization in Week 4.

---

# Repository Structure

```
Predictive-Maintenance-IOT/

src/
models/
docs/
notebooks/
data/
```

---

# Week 4 Roadmap

The final week of the internship will focus on:

- Noise Sensitivity Analysis
- Threshold Optimization
- Precision–Recall Optimization
- Final Documentation
- Repository Cleanup
- Submission Preparation

---

# Internship Progress

| Week | Status |
|------|--------|
| Week 1 | ✅ Completed |
| Week 2 | ✅ Completed |
| Week 3 | ✅ Completed |
| Week 4 | 🚀 In Progress |

---

## Project Status

**Current Stage:** Week 3 Completed Successfully 🎉

The project now contains a complete machine learning workflow including data preprocessing, feature engineering, hyperparameter optimization, explainability, evaluation, and model persistence. The remaining work in Week 4 will focus on optimization, documentation, and final submission.

# 📈 Current Pipeline

```text
Raw Dataset
      │
      ▼
Preprocessing
      │
      ▼
Feature Engineering
      │
      ▼
Context Data Fusion
      │
      ▼
Feature Selection
      │
      ▼
Pipeline Optimization
      │
      ▼
Predictive Model
```

---

# 🚀 Running the Project

Clone the repository:

```bash
git clone https://github.com/Ankursaini018/Predictive-Maintenance-IOT.git
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run preprocessing:

```bash
python src/preprocessing.py
```

Run feature selection:

```bash
python src/feature_selector.py
```

Run optimization:

```bash
python src/pipeline_optimizer.py
```

---

## 📊 Current Status

| Module       | Status         |
| ------------ | -------------- |
| Week 1       | ✅ Completed    |
| Week 2 Day 1 | ✅ Completed    |
| Week 2 Day 2 | ✅ Completed    |
| Week 2 Day 3 | ✅ Completed    |
| Week 2 Day 4 | ✅ Completed    |
| Week 2 Day 5 | ✅ Completed    |
| Week 2 Day 6 | ✅ Completed    |
| Week 2 Day 7 | ✅ Completed    |
| Week 3       | 🚧 In Progress |


---

## 📈 Current Status

### ✅ Completed

* **Week 1** – Data Exploration & Feature Engineering
* **Week 2** – Context Simulation, Data Fusion, Feature Analysis & Pipeline Optimization

### 🚧 In Progress

* **Week 3** – SMOTE Integration
* **LightGBM Model Development**

### 📅 Upcoming

* Precision–Recall Curve Analysis
* Decision Threshold Optimization
* Final Model Evaluation
* Project Documentation & Deployment Preparation


# 👨‍💻 Author

**Ankur Saini**

B.Tech Artificial Intelligence

Infotact DS/ML Internship       

---

