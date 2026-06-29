# SHAP Feature Importance Analysis Report

## Project Information

| Item | Details |
|------|---------|
| Project | Predictive Maintenance using LightGBM |
| Week | Week 3 |
| Day | Day 3 |
| Technique | SHAP (SHapley Additive Explanations) |
| Model | LightGBM |
| Objective | Explain feature importance and improve model interpretability |

---

# Objective

The objective of this analysis is to explain the predictions made by the final tuned LightGBM model using SHAP values.

This analysis helps identify which machine parameters have the greatest influence on predicting machine failure.

---

# Methodology

The following workflow was used:

1. Load the fused dataset.
2. Train the tuned LightGBM model.
3. Generate SHAP values.
4. Compute global feature importance.
5. Create visualization dashboards.
6. Analyze feature categories.
7. Summarize important findings.

---

# Generated Visualizations

| Visualization | Purpose |
|--------------|---------|
| SHAP Summary Plot | Overall feature impact |
| SHAP Feature Importance | Mean absolute SHAP values |
| SHAP Waterfall Plot | Local explanation for one prediction |
| Top 20 Features | Highest contributing variables |
| Category Distribution | Feature contribution by category |
| Cumulative Importance | Importance accumulation |
| Feature Histogram | Distribution of SHAP values |

---

# Key Findings

## Top Features

The model assigns the highest importance to a small number of engineered and sensor-based features.

Examples include:

- Tool Wear
- Torque
- Rotational Speed
- Process Temperature
- Air Temperature

These variables contribute most strongly to machine failure prediction.

---

## Category Analysis

Feature importance is distributed across multiple categories.

Categories include:

- Temperature
- Torque
- Rotation
- Tool Wear
- Machine Type
- Weather
- Shift
- Engineered Features

Engineered features collectively contribute significantly to predictive performance.

---

## Model Interpretability

SHAP provides both:

- Global explanations
- Local explanations

This improves transparency and makes the model easier to interpret.

---

# Benefits of SHAP

- Explains individual predictions.
- Explains overall model behavior.
- Identifies influential variables.
- Improves trust in machine learning models.
- Supports maintenance decision-making.

---

# Conclusion

The SHAP analysis confirms that the LightGBM model relies on meaningful operational features when predicting machine failures.

Feature importance analysis demonstrates that both original sensor measurements and engineered features contribute to predictive performance.

The generated visualizations improve model transparency and satisfy the explainability requirements of the predictive maintenance project.

---

# Output Files

```
src/tuning_results/

shap_summary_plot.png

shap_feature_importance.png

shap_waterfall_plot.png

top20_shap_features.png

feature_category_distribution.png

feature_importance_histogram.png

cumulative_feature_importance.png

shap_analysis_report.txt

shap_visualization_report.txt
```

---

**Status:** ✅ Completed Successfully