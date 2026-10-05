# 🔧 Predictive Maintenance IoT
## Infotact DS/ML Technical Internship 2026

![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
![ML](https://img.shields.io/badge/ML-LightGBM-blue)
![Python](https://img.shields.io/badge/Python-3.11-yellow)
![License](https://img.shields.io/badge/License-MIT-green)
![Issues](https://img.shields.io/badge/Issues-9%2F9%20Closed-success)
![Commits](https://img.shields.io/badge/Commits-20%2B%20Daily-orange)

---

## 🎯 Problem Statement

Industrial machines fail unexpectedly
causing massive production downtime and
revenue loss. Traditional maintenance is
either too early (wasteful) or too late
(breakdown already happened!).

**Solution:** Predict machine failures
BEFORE they happen using IoT sensor
data fused with external context!

---

## 🏗️ Project Architecture

Predictive-Maintenance-IOT/
│
├── src/
│ ├── preprocessing.py
│ ├── data_validator.py
│ ├── lgbm_smote_pipeline.py
│ ├── shap_analyzer.py
│ ├── ablation_study.py
│ ├── noise_injector.py
│ ├── threshold_tuner.py
│ ├── fusion_pipeline.py
│ ├── project_summary.py
│ └── tuning_results/
│ ├── shap_feature_importance.png
│ ├── ablation_f1_comparison.png
│ ├── robustness_curves.png
│ └── threshold_metrics.png
│
├── notebooks/
│ ├── week1/
│ ├── week2/
│ ├── week3/
│ └── week4/
│ └── week4_day3_final_summary.ipynb
│
├── data/ (gitignored)
├── models/ (gitignored)
├── requirements.txt
└── README.md


---

## 📊 Dataset

| Property | Value |
|---|---|
| Name | AI4I 2020 Predictive Maintenance |
| Source | UCI Machine Learning Repository |
| Rows | 10,000 sensor readings |
| Features | 14 original → 61+ engineered |
| Target | Machine Failure (Binary) |
| Failure Rate | 3.39% (29:1 imbalance) |

### IoT Sensors
| Sensor | Unit | Description |
|---|---|---|
| Air Temperature | K | Ambient temperature |
| Process Temperature | K | Operation temperature |
| Rotational Speed | RPM | Spindle rotation speed |
| Torque | Nm | Rotational force |
| Tool Wear | min | Cumulative tool usage |

---

## 🧠 ML Approach

### Week 1 — Feature Engineering
- 61+ features from 5 raw sensors
- Rolling statistics (mean/std/var)
- Domain features (power, temp_delta)
- Lag features (lag1, lag2, lag3)
- Z-score outlier flags

### Week 2 — Contextual Data Fusion
- Weather simulator (temperature/humidity)
- Factory load simulator (shift patterns)
- Timestamp-based merging
- 7-group ablation study

### Week 3 — LightGBM + SMOTE
- SMOTE strictly inside CV folds
- 5-fold Stratified Cross Validation
- Macro F1 metric (handles imbalance)
- SHAP explainability analysis
- Optuna hyperparameter tuning

### Week 4 — Robustness + Threshold
- 5 noise types (0.05 to 0.50 levels)
- 4 threshold tuning strategies
- Precision-Recall curve analysis
- Final deployment recommendation

---

## 🏆 Results

| Metric | Value | Status |
|---|---|---|
| Macro F1 Score | ≥ 0.85 | ✅ Achieved |
| Ablation Proof | G7 best (p<0.05) | ✅ Proved |
| Noise Resilience | Safe ≤ 20% | ✅ Proved |
| Top IoT Feature | Tool Wear | ✅ SHAP |
| Top External | Factory Load | ✅ SHAP |

---

## 🔑 Key Findings

### SHAP Top Features
| Rank | Feature | Type | Impact |
|---|---|---|---|
| 1 | Tool Wear | IoT Sensor | Highest |
| 2 | Torque | IoT Sensor | High |
| 3 | Factory Load | External | Significant |
| 4 | Power | Engineered | Medium |
| 5 | Temp Delta | Engineered | Medium |

---

## 🚀 How to Run

### 1. Clone Repository
```bash
git clone https://github.com/Ankursaini018/
Predictive-Maintenance-IOT.git
cd Predictive-Maintenance-IOT
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Download Dataset
Download AI4I 2020 dataset from:
https://archive.ics.uci.edu/dataset/601/
ai4i+2020+predictive+maintenance+dataset

Place ai4i2020.csv in data/ folder


### 4. Run Pipeline
```bash
# Validate data
cd src
python data_validator.py

# Run preprocessing
python preprocessing.py

# Run full pipeline
python lgbm_smote_pipeline.py

# Run SHAP analysis
python shap_analyzer.py

# Run ablation study
python ablation_study.py
```

### 5. Open Final Notebook
```bash
cd ..
jupyter notebook notebooks/week4/
week4_day3_final_summary.ipynb
```

---

## 🛠️ Tech Stack

| Category | Tool |
|---|---|
| Language | Python 3.11 |
| ML Model | LightGBM |
| Sampling | imbalanced-learn (SMOTE) |
| Tuning | Optuna + GridSearchCV |
| Explainability | SHAP |
| Validation | scikit-learn |
| Visualization | Matplotlib + Seaborn |
| Version Control | Git + GitHub |

---

## 📈 GitHub Stats

| Metric | Value |
|---|---|
| Issues Closed | 9/9 ✅ |
| Daily Commits | 20+ consecutive ✅ |
| Python Scripts | 25+ ✅ |
| Notebooks | 7 ✅ |
| Unit Tests | 8 passing ✅ |

---

## 🔗 Links

- **GitHub:** github.com/Ankursaini018/
  Predictive-Maintenance-IOT
- **Intern:** Ankur Saini
- **Program:** Infotact DS/ML Internship 2026
- **Duration:** 5th June - 11th July 2026
- **Certificate:** IF475373