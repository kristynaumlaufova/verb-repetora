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
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements.txt separately for better caching
COPY BE/fsrs/requirements.txt ./fsrs/
# Install Python dependencies
RUN pip3 install -r ./fsrs/requirements.txt

# Create wwwroot directory
RUN mkdir -p wwwroot
COPY --from=frontend /frontend/build/ ./wwwroot/
# Debug - verify contents
RUN ls -la wwwroot/

ENTRYPOINT ["dotnet", "BE.dll"]