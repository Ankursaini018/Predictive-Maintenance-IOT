"""
external_data package
=====================

Utilities for generating and managing
external contextual data used in the
Predictive Maintenance project.

Modules
-------
weather_simulator
    Simulates weather conditions.

load_simulator
    Simulates factory workload.

data_fusion
    Merges IoT telemetry with
    external contextual features.

Project
-------
Contextual Predictive Maintenance (IoT Edge AI)

Internship
----------
Infotact DS/ML Internship
"""

from .weather_simulator import (
    generate_timestamps,
    simulate_weather,
    encode_weather,
)

from .load_simulator import (
    simulate_factory_load,
)

from .data_fusion import (
    create_fused_dataset,
    get_fused_arrays,
)

__all__ = [
    "generate_timestamps",
    "simulate_weather",
    "encode_weather",
    "simulate_factory_load",
    "create_fused_dataset",
    "get_fused_arrays",
]