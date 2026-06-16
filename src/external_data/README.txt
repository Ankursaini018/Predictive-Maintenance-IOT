EXTERNAL CONTEXT DATA
=====================
This folder contains scripts to simulate
external contextual data for IoT fusion.

Files:
- weather_simulator.py   → Simulates weather API data
- load_simulator.py      → Simulates factory load data
- data_fusion.py         → Merges IoT + external data

Why Simulated?
==============
Real external APIs (OpenWeatherMap etc)
require paid access. We simulate realistic
data based on the same timestamps as the
AI4I dataset. This follows the internship
spec which says:
"simulate or integrate external context"