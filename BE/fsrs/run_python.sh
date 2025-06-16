#!/bin/bash
# Python wrapper script for running Python with the right environment

# Print some diagnostic information
echo "Running Python wrapper script" >&2
echo "Command arguments: $@" >&2
echo "Current directory: $(pwd)" >&2

# Check if the file exists
if [ ! -f "$1" ]; then
    echo "Error: File not found: $1" >&2
    echo "Searching for the file in common locations:" >&2
    
    # Try to find the file in alternative locations
    SCRIPT_NAME=$(basename "$1")
    POSSIBLE_LOCATIONS=(
        "./fsrs/$SCRIPT_NAME"
        "/app/fsrs/$SCRIPT_NAME"
        "$(dirname "$0")/$SCRIPT_NAME"
    )
    
    for location in "${POSSIBLE_LOCATIONS[@]}"; do
        if [ -f "$location" ]; then
            echo "Found file at alternative location: $location" >&2
            SCRIPT_PATH="$location"
            break
        fi
    done
    
    if [ -z "$SCRIPT_PATH" ]; then
        echo "Could not find $SCRIPT_NAME in any common location" >&2
        echo "Directories in /app:" >&2
        ls -la /app >&2
        echo "Directories in /app/fsrs (if exists):" >&2
        ls -la /app/fsrs 2>/dev/null || echo "/app/fsrs does not exist" >&2
        exit 1
    else
        echo "Using alternative location: $SCRIPT_PATH" >&2
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
    echo "Using Python from virtual environment" >&2
    PYTHON_CMD="/opt/venv/bin/python"
else
    echo "Virtual environment not found, using system Python" >&2
    PYTHON_CMD="python3"
fi

# Verify that Python works
if ! $PYTHON_CMD --version >/dev/null 2>&1; then
    echo "Error: Python not working with command $PYTHON_CMD" >&2
    echo "Trying system Python as fallback" >&2
    PYTHON_CMD="python3"
    
    if ! $PYTHON_CMD --version >/dev/null 2>&1; then
        echo "Error: System Python not working either" >&2
        exit 1
    fi
fi

# Check if required packages are installed
echo "Checking for required packages..." >&2
MISSING_PACKAGES=0

if ! check_package "$PYTHON_CMD" pandas; then
    echo "Error: pandas package not found" >&2
    MISSING_PACKAGES=1
fi

if ! check_package "$PYTHON_CMD" torch; then
    echo "Error: torch package not found" >&2
    MISSING_PACKAGES=1
fi

if [ $MISSING_PACKAGES -eq 1 ]; then
    echo "Warning: Some required packages are missing, attempting to install them" >&2
    
    # Try to install missing packages
    if [ -f /opt/venv/bin/pip ]; then
        echo "Installing missing packages with virtual environment pip" >&2
        /opt/venv/bin/pip install pandas torch --no-cache-dir
    else
        echo "Installing missing packages with system pip" >&2
        pip3 install pandas torch --break-system-packages --no-cache-dir
    fi
    
    # Check again after installation attempt
    if ! check_package "$PYTHON_CMD" pandas || ! check_package "$PYTHON_CMD" torch; then
        echo "Error: Failed to install required packages" >&2
        exit 1
    fi
fi

echo "Running Python with command: $PYTHON_CMD $@" >&2
# Execute the Python command
exec $PYTHON_CMD "$@"
