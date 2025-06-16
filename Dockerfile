# Backend
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# Copy only the project file first
COPY ["BE/BE.csproj", "./"]
# Restore NuGet packages layer
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet restore "BE.csproj"
# Copy everything else
COPY BE/ .
RUN dotnet publish BE.csproj -c Release -o /app

# Frontend
FROM node:16 AS frontend
WORKDIR /frontend
# Enable npm cache
RUN npm config set cache /tmp/npm-cache --global

# First copy only package files to cache dependencies
COPY fe/package*.json ./
# Install dependencies with cache mount
RUN --mount=type=cache,target=/tmp/npm-cache \
    npm install
# Copy the rest of the frontend files
COPY fe/ .
# Build the frontend
RUN npm run build
# Debug - list contents
RUN ls -la
RUN ls -la build/
RUN ls -la build/static/

# Final image
FROM base AS final
WORKDIR /app
COPY --from=build /app .

# Install Python and required packages for FSRS
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set up a Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Python requirements.txt separately for better caching
COPY BE/fsrs/ ./fsrs/
RUN chmod +x ./fsrs/run_python.sh ./fsrs/check_environment.sh

# List fsrs directory contents for debugging
RUN ls -la ./fsrs/

# Install Python dependencies in the virtual environment
RUN pip3 install --no-cache-dir -r ./fsrs/requirements.txt

# Add diagnostic script to verify Python environment
RUN echo '#!/bin/bash\necho "Python version:"\npython3 --version\necho "PIP version:"\npip3 --version\necho "Installed packages:"\npip3 list\necho "Testing imports:"\npython3 -c "import sys; print(sys.path); import pandas; print(f\"pandas version: {pandas.__version__}\"); import torch; print(f\"torch version: {torch.__version__}\"); import numpy; print(f\"numpy version: {numpy.__version__}\")"' > /app/check_python.sh && chmod +x /app/check_python.sh

# Run the diagnostic script during build to verify environment
RUN /app/check_python.sh || echo "Warning: Python environment check failed but continuing build"

# Create wwwroot directory
RUN mkdir -p wwwroot
COPY --from=frontend /frontend/build/ ./wwwroot/
# Debug - verify contents
RUN ls -la wwwroot/

ENTRYPOINT ["dotnet", "BE.dll"]