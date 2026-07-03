# 🔧 Predictive Maintenance IoT
## Infotact DS/ML Technical Internship 2026

![Progress](https://img.shields.io/badge/Status-Complete-brightgreen)
![Week](https://img.shields.io/badge/Week-4%20of%204-blue)
![Issues](https://img.shields.io/badge/Issues-9%2F9%20Closed-green)
![Model](https://img.shields.io/badge/Model-LightGBM-orange)
![Python](https://img.shields.io/badge/Python-3.10%2B-yellow)

---

## 🎯 Project Overview
**Type:** Contextual Predictive Maintenance (IoT Edge AI)
**Mode:** Solo Worker
**Dataset:** AI4I 2020 Predictive Maintenance (UCI)

> Build an AI system that predicts machine failures
> before they happen by fusing internal IoT sensor
> data with external contextual signals
> (weather + factory load).

---

## 🏆 Final Results

| Metric | Score | Target |
|---|---|---|
| Macro F1 | See project_summary.json | ≥ 0.85 |
| ROC AUC | See project_summary.json | - |
| SMOTE | Inside CV folds only | ✅ |
| Noise Robustness | Tested (5 types) | ✅ |
| Threshold Tuned | Balanced strategy | ✅ |

---

## 📁 Project Structure
Predictive-Maintenance-IOT/
│
├── notebooks/
│   ├── week1_.ipynb          # IoT ingestion
│   ├── week2_.ipynb          # Data fusion
│   ├── week3/
│   │   └── week3_.ipynb      # LightGBM modeling
│   └── week4/
│       └── week4_.ipynb      # Noise + threshold
│
├── src/
│   ├── preprocessing.py       # IoT feature pipeline
│   ├── visualizations.py      # Plotting functions
│   ├── data_validator.py      # Data quality checks
│   ├── test_preprocessing.py  # Unit tests
│   ├── utils.py               # Shared utilities
│   ├── external_data/
│   │   ├── weather_simulator.py
│   │   ├── load_simulator.py
│   │   └── data_fusion.py
│   ├── ablation_study.py      # 7-group ablation
│   ├── statistical_tests.py   # t-test, Wilcoxon
│   ├── fusion_pipeline.py     # Master fusion
│   ├── feature_selector.py    # Feature selection
│   ├── lgbm_smote_pipeline.py # SMOTE + CV
│   ├── hyperparameter_tuner.py
│   ├── optuna_tuner.py
│   ├── shap_analyzer.py       # SHAP analysis
│   ├── shap_visualizer.py
│   ├── final_model_pipeline.py
│   ├── noise_injector.py      # 5-type noise
│   ├── robustness_tester.py
│   ├── pr_curve_analyzer.py
│   ├── threshold_tuner.py     # 4 strategies
│   └── project_summary.py     # Final summary
│
├── data/                      # gitignored
├── models/                    # gitignored
├── requirements.txt
└── README.md

---

## 📅 Week-wise Progress

### ✅ Week 1 — IoT Telemetry Ingestion
| Feature Category | Count |
|---|---|
| Raw Sensor Features | 5 |
| Rolling Mean/Std/Var | 15 |
| Domain Features | 6 |
| Lag Features | 12 |
| Rate of Change | 6 |
| Outlier Flags | 6 |
| **TOTAL** | **50+** |

### ✅ Week 2 — Contextual Data Fusion
| External Source | Features |
|---|---|
| Weather (Simulated) | ambient_temp, humidity, wind, pressure, condition |
| Factory Load (Simulated) | load%, utilization%, shift, weekend, maintenance, production |

**Ablation Study:** 7 feature groups tested
**Statistical Proof:** t-test p<0.05, Wilcoxon confirmed

### ✅ Week 3 — LightGBM + SMOTE
| Config | Value |
|---|---|
| Algorithm | LightGBM (GBDT) |
| CV Strategy | 5-Fold Stratified |
| Imbalance Fix | SMOTE inside folds only |
| Tuning | Grid Search + Optuna |
| SHAP | Feature importance analyzed |

### ✅ Week 4 — Noise + Threshold
| Task | Details |
|---|---|
| Noise Types | Gaussian, Missing, Drift, Spike, Scaling |
| Noise Levels | 0.05 → 0.50 |
| PR Curves | Plotted and analyzed |
| Threshold | 4 strategies evaluated |

---

## 🔬 How to Run

### 1. Setup
```bash
pip install -r requirements.txt
```

### 2. Download Dataset
Place `ai4i2020.csv` in `data/` folder.
[Download from UCI](https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset)

### 3. Validate Data
```bash
cd src
python data_validator.py
```

### 4. Run Tests
```bash
python test_preprocessing.py
```

### 5. Run Full Pipeline
```bash
python project_summary.py
```

### 6. Generate Final Summary
```bash
python project_summary.py
```

---

## 📊 GitHub Issues

| Issue | Title | Status |
|---|---|---|
| #1 | Ingest AI4I dataset | ✅ Closed |
| #2 | Compute rolling means | ✅ Closed |
| #3 | Simulate external context | ✅ Closed |
| #4 | Merge IoT + external | ✅ Closed |
| #5 | Ablation study | ✅ Closed |
| #6 | SMOTE inside CV | ✅ Closed |
| #7 | Train LightGBM | ✅ Closed |
| #8 | Noise + PR curves | ✅ Closed |
| #9 | Threshold tuning | ✅ Closed |

---

## 🛠️ Tech Stack

| Category | Tools |
|---|---|
| Language | Python 3.10+ |
| ML Model | LightGBM |
| Imbalance | SMOTE (imbalanced-learn) |
| Explainability | SHAP |
| Tuning | Optuna |
| Data | Pandas, NumPy, SciPy |
| Visualization | Matplotlib, Seaborn |
| Version Control | Git + GitHub |

---

## 👤 Intern Details
**Program:** Infotact DS/ML Technical Internship 2026
**Project:** Project 1 — Contextual Predictive Maintenance
**Mode:** Solo Worker
**GitHub:** Ankursaini018
