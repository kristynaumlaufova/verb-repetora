#!/bin/bash
# Python wrapper script for running Python with the right environment

# Check if the file exists
if [ ! -f "$1" ]; then
    # Try to find the file in alternative locations
    SCRIPT_NAME=$(basename "$1")
    POSSIBLE_LOCATIONS=(
        "./fsrs/$SCRIPT_NAME"
        "/app/fsrs/$SCRIPT_NAME"
        "$(dirname "$0")/$SCRIPT_NAME"
    )
    
    for location in "${POSSIBLE_LOCATIONS[@]}"; do
        if [ -f "$location" ]; then
            SCRIPT_PATH="$location"
            break
        fi
    done
    
    if [ -z "$SCRIPT_PATH" ]; then
        exit 1
    else
        set -- "$SCRIPT_PATH" "${@:2}"
    fi
fi

# Function to check if a package is installed
check_package() {
    python_cmd=$1
    package=$2
    $python_cmd -c "import $package" 2>/dev/null
    return $?
}

# If the virtual environment exists, use it
if [ -f /opt/venv/bin/python ]; then
    PYTHON_CMD="/opt/venv/bin/python"
else
    PYTHON_CMD="python3"
fi

# Verify that Python works
if ! $PYTHON_CMD --version >/dev/null 2>&1; then
    PYTHON_CMD="python3"
    
    if ! $PYTHON_CMD --version >/dev/null 2>&1; then
        exit 1
    fi
fi

# Check if required packages are installed
MISSING_PACKAGES=0

if ! check_package "$PYTHON_CMD" pandas; then
    MISSING_PACKAGES=1
fi

if ! check_package "$PYTHON_CMD" torch; then
    MISSING_PACKAGES=1
fi

if [ $MISSING_PACKAGES -eq 1 ]; then
    # Try to install missing packages
    if [ -f /opt/venv/bin/pip ]; then
        /opt/venv/bin/pip install pandas torch --no-cache-dir
    else
        pip3 install pandas torch --break-system-packages --no-cache-dir
    fi
    
    # Check again after installation attempt
    if ! check_package "$PYTHON_CMD" pandas || ! check_package "$PYTHON_CMD" torch; then
        exit 1
    fi
fi

# Execute the Python command
exec $PYTHON_CMD "$@"
