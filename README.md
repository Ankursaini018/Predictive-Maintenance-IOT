# 🔧 Predictive Maintenance IoT
### Infotact DS/ML Internship 2026 | Ankur Saini

![Status](https://img.shields.io/badge/Status-Complete-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![ML](https://img.shields.io/badge/Model-LightGBM-orange)
![F1](https://img.shields.io/badge/Macro_F1-≥0.85-success)
![Issues](https://img.shields.io/badge/Issues-9%2F9_Closed-success)
![Commits](https://img.shields.io/badge/Daily_Commits-20%2B-yellow)

---

## 🎯 Overview

Predicts industrial machine failures **before they happen** by fusing IoT sensor data with external context like weather and factory load patterns.

> **Real World Impact:** Prevents unexpected production downtime and reduces maintenance costs significantly.

---

## 📊 Dataset

| Property | Value |
|---|---|
| Source | AI4I 2020 — UCI ML Repository |
| Size | 10,000 sensor readings |
| Features | 14 original → 61+ engineered |
| Target | Machine Failure (Yes / No) |
| Failure Rate | 3.39% (29:1 class imbalance) |

---

## 🔌 IoT Sensors

| Sensor | Unit | Role |
|---|---|---|
| Air Temperature | K | Ambient condition |
| Process Temperature | K | Operation heat |
| Rotational Speed | RPM | Spindle speed |
| Torque | Nm | Rotational force |
| Tool Wear | min | Cumulative usage |

---

## 🧠 ML Approach

| Component | Detail |
|---|---|
| Algorithm | LightGBM Classifier |
| Imbalance | SMOTE inside CV folds only |
| Validation | 5-Fold Stratified Cross Validation |
| Metric | Macro F1 Score |
| Tuning | Optuna + GridSearchCV |
| Explainability | SHAP Analysis |

---

## 🏆 Results

| Achievement | Value | Status |
|---|---|---|
| Macro F1 Score | ≥ 0.85 | ✅ |
| Ablation Study | G7 best (p < 0.05) | ✅ |
| Noise Resilience | Safe up to 20% | ✅ |
| Top IoT Feature | Tool Wear | ✅ |
| Top External Feature | Factory Load | ✅ |

---

## 📁 Project Structure

```
Predictive-Maintenance-IOT/
├── src/
│   ├── data_validator.py
│   ├── preprocessing.py
│   ├── lgbm_smote_pipeline.py
│   ├── shap_analyzer.py
│   ├── ablation_study.py
│   ├── noise_injector.py
│   ├── threshold_tuner.py
│   ├── fusion_pipeline.py
│   ├── project_summary.py
│   └── tuning_results/
│       ├── shap_feature_importance.png
│       ├── ablation_f1_comparison.png
│       ├── robustness_curves.png
│       └── threshold_metrics.png
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── index.html
├── notebooks/
│   ├── week1/
│   ├── week2/
│   ├── week3/
│   └── week4/
├── data/               ← gitignored
├── models/             ← gitignored
├── requirements.txt
└── README.md
```

---

## 🚀 How to Run

### Backend (ML Pipeline)

```bash
# Clone repo
git clone https://github.com/Ankursaini018/Predictive-Maintenance-IOT.git
cd Predictive-Maintenance-IOT

# Install dependencies
pip install -r requirements.txt

# Download dataset
# Place ai4i2020.csv inside data/ folder
# Download from: https://archive.ics.uci.edu/dataset/601

# Validate data
cd src
python data_validator.py

# Run preprocessing
python preprocessing.py

# Run full ML pipeline
python lgbm_smote_pipeline.py

# Run SHAP analysis
python shap_analyzer.py
```

### Frontend (Dashboard)

```bash
# Go to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at:
# http://localhost:5173
```

### Run Both Together

```bash
# Terminal 1 — Backend
cd src
python lgbm_smote_pipeline.py

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## 🛠️ Tech Stack

**Backend:** Python 3.11 · LightGBM · SHAP · Optuna · scikit-learn · imbalanced-learn · Pandas · NumPy

**Frontend:** React · Tailwind CSS · Recharts · Vite

**DevOps:** Git · GitHub · Vercel

---

## 📈 GitHub Stats

| Metric | Value |
|---|---|
| Issues Closed | 9 / 9 |
| Consecutive Commits | 20+ days |
| Python Scripts | 25+ |
| Unit Tests | 8 passing |
| Notebooks | 7 |

---

## 🔗 Links

| Resource | Link |
|---|---|
| GitHub | [Predictive-Maintenance-IOT](https://github.com/Ankursaini018/Predictive-Maintenance-IOT) |
| Certificate | IF475373 |

---

*Ankur Saini · Infotact DS/ML Internship 2026 · 5th June - 11th July 2026*