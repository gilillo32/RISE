#!/bin/bash

SCAN_SCRIPT="/home/RISE/nuclei/launch_scan.py"
PROCESS_SCRIPT="/home/RISE/nuclei/process_results.py"
VENV_PYTHON="/home/RISE/venv/bin/python3"

# Bucle infinito para ejecutar escaneo y procesamiento
while true; do
    echo "Starting scan..."
    $VENV_PYTHON $SCAN_SCRIPT -y

    echo "Processing scan results..."
    $VENV_PYTHON $PROCESS_SCRIPT

    echo "Cycle completed. Restarting..."
done
