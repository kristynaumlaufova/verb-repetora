#!/bin/bash
# This script checks the Python environment and verifies that the necessary packages are installed

echo "===== Python Environment Check ====="
echo "Current directory: $(pwd)"
echo "Python version:"
python3 --version
echo ""

echo "Pip version:"
pip3 --version
echo ""

echo "Checking for virtual environment:"
if [ -d "/opt/venv" ]; then
    echo "Virtual environment exists at /opt/venv"
    echo "Activating virtual environment..."
    source /opt/venv/bin/activate
    echo "Python path after activation: $(which python)"
else
    echo "Virtual environment not found at /opt/venv"
fi
echo ""

echo "Installed packages:"
pip3 list
echo ""

echo "Testing imports:"
python3 -c "
import sys
print('Python path:')
print(sys.path)
print('')

try:
    import pandas
    print(f'pandas version: {pandas.__version__}')
except ImportError as e:
    print(f'Error importing pandas: {e}')

try:
    import torch
    print(f'torch version: {torch.__version__}')
except ImportError as e:
    print(f'Error importing torch: {e}')

try:
    import numpy
    print(f'numpy version: {numpy.__version__}')
except ImportError as e:
    print(f'Error importing numpy: {e}')
"
echo ""

echo "Checking optimizer.py:"
OPTIMIZER_PATH="./fsrs/optimizer.py"
if [ -f "$OPTIMIZER_PATH" ]; then
    echo "optimizer.py exists ($(wc -l < $OPTIMIZER_PATH) lines)"
    echo "First 10 lines:"
    head -n 10 "$OPTIMIZER_PATH"
else
    echo "optimizer.py not found at $OPTIMIZER_PATH"
fi
echo ""

echo "Testing optimizer with sample data:"
SAMPLE_DATA='[{"card_id":1,"rating":3,"review_datetime":"2025-01-01T12:00:00.000Z","review_duration":10}]'

echo "Sample data: $SAMPLE_DATA"
echo "$SAMPLE_DATA" | python3 ./fsrs/optimizer.py
echo ""

echo "===== Check Complete ====="
