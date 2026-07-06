#!/usr/bin/env bash
set -euo pipefail
python -m pip install --upgrade pip
pip install -r requirements.txt
python scripts/build_demographics.py --kml data/submarkets.kml --output-dir output
