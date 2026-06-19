from scipy.stats import ttest_ind
import pandas as pd

def compare_scores(group1, group2):

    stat, p_value = ttest_ind(
        group1,
        group2,
        equal_var=False
    )

    return {
        "t_statistic": stat,
        "p_value": p_value
    }

print("✅ Statistical testing module ready")