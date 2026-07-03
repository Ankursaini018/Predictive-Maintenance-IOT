"""
run_all_tests.py
================
Runs all validation and tests
to verify project is working correctly.

Run this before final review!

Infotact DS/ML Internship — Project 1
"""

import subprocess
import sys
import os

def run_test(script_name: str, description: str) -> bool:
    """Run a single test script."""

    print(f"\nTesting: {description}")
    print(f"Script : {script_name}")

    try:
        result = subprocess.run(
    [sys.executable, script_name],
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
    timeout=30
)

        if result.returncode == 0:
            print("Status : ✅ PASSED")
            return True

        print("Status : ❌ FAILED")

        if result.stderr.strip():
            print("\n----- STDERR -----")
            print(result.stderr)

        if result.stdout.strip():
            print("\n----- STDOUT -----")
            print(result.stdout)

        return False

    except subprocess.TimeoutExpired:
        print("Status : ⏰ TIMEOUT")
        return False

    except Exception as e:
        print(f"Status : ❌ ERROR\n{e}")
        return False


if __name__ == "__main__":
    print("=" * 55)
    print("  RUNNING ALL PROJECT TESTS")
    print("=" * 55)

    tests = [
        ('test_preprocessing.py',
         'Preprocessing unit tests'),
        ('data_validator.py',
         'Dataset validation'),
        ('utils.py',
         'Utility functions'),
    ]

    os.chdir(os.path.dirname(
        os.path.abspath(__file__)
    ))

    results = []
    for script, desc in tests:
        passed = run_test(script, desc)
        results.append((desc, passed))

    print("\n" + "=" * 55)
    print("  TEST SUMMARY")
    print("=" * 55)
    all_passed = all(r for _, r in results)
    for desc, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} | {desc}")

    print("\n" + "=" * 55)
    if all_passed:
        print("  ✅ ALL TESTS PASSED!")
        print("  Project is ready for review!")
    else:
        print("  ⚠️  Some tests failed!")
        print("  Please fix before review!")
    print("=" * 55)