#!/bin/bash
# Simple wrapper script for running python from the virtual environment
# This script is called by the .NET application

# If the virtual environment exists, use it, otherwise use system Python
if [ -f /opt/venv/bin/python ]; then
    /opt/venv/bin/python "$@"
else
    python3 "$@"
fi
