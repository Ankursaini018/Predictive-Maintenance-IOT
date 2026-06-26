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

# 📊 Current Status

| Module | Status |
|---------|--------|
| Week 1 | ✅ Completed |
| Week 2 Day 1 | ✅ Completed |
| Week 2 Day 2 | ✅ Completed |
| Week 2 Day 3 | ✅ Completed |
| Week 2 Day 4 | ✅ Completed |
| Week 2 Day 5 | ✅ Completed |
| Week 2 Day 6 | 🚧 In Progress |

---

# 👨‍💻 Author

**Ankur Saini**

B.Tech Artificial Intelligence

Infotact DS/ML Internship       

---

# 📈 Current Status

## ✅ Completed

- Week 1 – IoT Data Exploration & Feature Engineering
- Week 2 – Context Simulation, Data Fusion & Optimization

## 🔄 In Progress

- Week 3 – SMOTE Integration
- LightGBM Model Development

## 📅 Upcoming

- Precision–Recall Analysis
- Threshold Optimization
- Final Documentation