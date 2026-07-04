"""
final_verification.py
=====================

Final verification script that checks
whether the project is ready for
final review.

Infotact DS/ML Internship
Week 4 - Day 4
"""

import os
import json
import sys
import warnings

warnings.filterwarnings("ignore")

# --------------------------------------------------
# Project Paths
# --------------------------------------------------

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_ROOT = os.path.abspath(
    os.path.join(CURRENT_DIR, "..")
)

sys.path.insert(0, CURRENT_DIR)


# --------------------------------------------------
# Helper Functions
# --------------------------------------------------

def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def check_file_exists(filepath, description):
    """
    Check whether a required file exists.
    """

    exists = os.path.exists(filepath)

    status = "[PASS]" if exists else "[FAIL]"

    print(f"{status:<8} {description}")

    if not exists:
        print(f"Missing File : {filepath}")

    return exists


def check_directory_exists(dirpath, description):
    """
    Check whether a directory exists.
    """

    exists = os.path.isdir(dirpath)

    status = "[PASS]" if exists else "[FAIL]"

    print(f"{status:<8} {description}")

    return exists


def check_requirements():
    """
    Verify requirements.txt exists.
    """

    requirements_path = os.path.join(
        PROJECT_ROOT,
        "requirements.txt"
    )

    print_section("CHECKING REQUIREMENTS")

    if not os.path.exists(requirements_path):
        print("[FAIL] requirements.txt not found")
        return False

    print("[PASS] requirements.txt found")

    with open(
        requirements_path,
        "r",
        encoding="utf-8"
    ) as f:
        content = f.read().lower()

    required_packages = [
        "numpy",
        "pandas",
        "scikit-learn",
        "lightgbm",
        "imbalanced-learn",
        "matplotlib"
    ]

    all_found = True

    for package in required_packages:

        if package in content:
            print(f"[PASS] {package}")
        else:
            print(f"[FAIL] {package}")
            all_found = False

    return all_found


def check_project_summary():
    """
    Verify project_summary.json exists.
    """

    summary_path = os.path.join(
        CURRENT_DIR,
        "project_summary.json"
    )

    print_section("PROJECT SUMMARY")

    if not os.path.exists(summary_path):
        print("[FAIL] project_summary.json not found")
        return False

    print("[PASS] project_summary.json found")

    try:

        with open(
            summary_path,
            "r",
            encoding="utf-8"
        ) as f:

            summary = json.load(f)

        print("[PASS] JSON loaded successfully")

        print(
            f"Keys Found : {len(summary.keys())}"
        )

        return True

    except Exception as e:

        print(f"[FAIL] {e}")

        return False
# --------------------------------------------------
# Main Verification
# --------------------------------------------------

def run_final_verification():
    """
    Run all project verification checks.
    """

    print("=" * 60)
    print("FINAL PROJECT VERIFICATION")
    print("Predictive Maintenance IoT")
    print("=" * 60)

    results = []

    # --------------------------------------------------
    # Source Files
    # --------------------------------------------------

    print_section("SOURCE FILES")

    source_files = [

        ("preprocessing.py", "Preprocessing"),

        ("data_validator.py", "Dataset Validator"),

        ("model_evaluator.py", "Model Evaluator"),

        ("project_summary.py", "Project Summary"),

        ("run_all_tests.py", "Test Runner"),

        ("threshold_optimizer.py", "Threshold Optimizer")

    ]

    for filename, description in source_files:

        filepath = os.path.join(
            CURRENT_DIR,
            filename
        )

        results.append(

            check_file_exists(
                filepath,
                description
            )

        )

    # --------------------------------------------------
    # Directories
    # --------------------------------------------------

    print_section("DIRECTORY STRUCTURE")

    directories = [

        (
            os.path.join(
                PROJECT_ROOT,
                "src"
            ),
            "src/"
        ),

        (
            os.path.join(
                PROJECT_ROOT,
                "notebooks"
            ),
            "notebooks/"
        ),

        (
            os.path.join(
                CURRENT_DIR,
                "external_data"
            ),
            "external_data/"
        )

    ]

    for directory, description in directories:

        results.append(

            check_directory_exists(
                directory,
                description
            )

        )

    # --------------------------------------------------
    # Requirements
    # --------------------------------------------------

    results.append(
        check_requirements()
    )

    # --------------------------------------------------
    # Project Summary
    # --------------------------------------------------

    results.append(
        check_project_summary()
    )

    # --------------------------------------------------
    # Final Score
    # --------------------------------------------------

    passed = sum(results)

    total = len(results)

    score = (passed / total) * 100

    print("\n" + "=" * 60)

    print("VERIFICATION SUMMARY")

    print("=" * 60)

    print(f"Checks Passed : {passed}/{total}")

    print(f"Score         : {score:.2f}%")

    if score == 100:

        print("\n[SUCCESS] Project is fully verified!")

    elif score >= 80:

        print("\n[GOOD] Project is mostly ready.")

    else:

        print("\n[WARNING] Review the missing items.")

    print("=" * 60)

    return score


# --------------------------------------------------
# Main
# --------------------------------------------------

def main():

    run_final_verification()


if __name__ == "__main__":

    main()