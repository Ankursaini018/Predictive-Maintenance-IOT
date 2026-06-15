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