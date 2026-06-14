# 🚀 Predictive-Maintenance-IOT

Contextual Predictive Maintenance using IoT and Machine Learning

---

## 📌 Project Overview

This project focuses on predicting machine failures using **industrial IoT sensor data** and **machine learning**.

The goal is to detect machine failures **before breakdown happens** by analyzing:

- Sensor signals
- Failure patterns
- Statistical features
- Signal trends
- Context-aware engineered features

Dataset used:

**AI4I 2020 Predictive Maintenance Dataset**

---

## 🎯 Objectives

- Predict machine failures
- Engineer useful predictive features
- Analyze sensor behavior
- Handle class imbalance
- Build robust ML models
- Optimize predictive performance

---

## 📁 Project Structure

```txt
Predictive-Maintenance-IOT/
│── data/
│── models/
│── notebooks/
│── src/
│── README.md
│── requirements.txt
```

---

## 📊 Week 1 Progress

### ✅ Day 1
- Dataset loading
- Dataset inspection
- Basic EDA
- Missing value analysis

### ✅ Day 2
- Signal analysis
- Failure type breakdown
- Correlation heatmap
- Rolling anomaly analysis

### ✅ Day 3
- Feature engineering
- Power feature
- Temperature delta
- Tool wear rate

### ✅ Day 4
- Advanced signal processing
- Lag features
- Rate-of-change features
- Outlier analysis

### ✅ Day 5
- Refactoring preprocessing pipeline
- Constants
- Modular functions
- Unit testing

### ✅ Day 6
- EDA summary notebook
- Visualization utilities
- Model validation module
- Project documentation

### 🔄 Day 7 (Upcoming)
- Final Week 1 polishing
- Repository cleanup
- Final documentation
- Week 1 completion

---

## 📊 Generated Visual Outputs

| Chart | Description |
|---|---|
| failure_types.png | Failure type distribution |
| correlation_heatmap.png | Feature correlation matrix |
| sensor_distributions.png | Sensor distribution comparison |
| anomaly_signals.png | Signal anomaly visualization |
| engineered_features_dist.png | Engineered features distribution |
| feature_correlation_target.png | Top correlated features |
| class_imbalance.png | Class imbalance visualization |
| day4_feature_importance.png | Feature importance |
| day4_outliers.png | Outlier analysis |

---

## 🧪 Testing

Run preprocessing tests:

```bash
cd src
python test_preprocessing.py
```

Run model validator:

```bash
cd src
python model_validator.py
```

---

## 📁 Source Files

| File | Purpose |
|---|---|
| `src/preprocessing.py` | Feature engineering pipeline |
| `src/visualizations.py` | Reusable plotting utilities |
| `src/model_validator.py` | Model validation utilities |
| `src/test_preprocessing.py` | Unit tests |

---

## 🛠️ Tech Stack

- Python
- Pandas
- NumPy
- Matplotlib
- Seaborn
- Scikit-learn
- Jupyter Notebook

---

## 📈 Current Status

🟢 Week 1 in progress  
🟢 Day 6 completed  
🔄 Day 7 remaining  
🚀 Week 2 model training coming soon