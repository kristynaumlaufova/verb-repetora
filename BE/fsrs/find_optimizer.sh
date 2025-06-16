#!/bin/bash
# Script to find and validate the optimizer.py file

echo "===== Optimizer Script Finder ====="
echo "Current directory: $(pwd)"

# Common locations to check
LOCATIONS=(
  "./fsrs/optimizer.py"
  "/app/fsrs/optimizer.py"
  "$(pwd)/fsrs/optimizer.py"
)

# Function to check if file exists and has content
check_file() {
  local path=$1
  echo "Checking: $path"
  
  if [ -f "$path" ]; then
    echo "✅ File exists!"
    echo "File size: $(wc -c < "$path") bytes"
    echo "First 5 lines:"
    head -n 5 "$path"
    return 0
  else
    echo "❌ File not found"
    return 1
  fi
}

# Check all locations
FOUND=0
for location in "${LOCATIONS[@]}"; do
  if check_file "$location"; then
    FOUND=1
    echo "Found optimizer.py at: $location"
  fi
  echo "---"
done

# Search for optimizer.py in common directories
echo "Searching for optimizer.py in common directories:"
find /app -name optimizer.py 2>/dev/null || echo "No optimizer.py found in /app"
find . -name optimizer.py 2>/dev/null || echo "No optimizer.py found in current directory tree"

# Check Python environment
echo "Python environment:"
which python3 || echo "python3 not found"
which python || echo "python not found"
which pip3 || echo "pip3 not found"

if [ -d "/opt/venv" ]; then
  echo "Virtual environment exists at /opt/venv"
  echo "Python in venv: $(ls -la /opt/venv/bin/python 2>/dev/null || echo 'not found')"
fi

# Summary
if [ $FOUND -eq 0 ]; then
  echo "❌ optimizer.py not found in any common location."
  echo "This explains the 'No such file or directory' error."
  echo "Please ensure the optimizer.py file is copied correctly during the Docker build."
else
  echo "✅ optimizer.py found. If you're still having issues, check permissions and Python environment."
fi
