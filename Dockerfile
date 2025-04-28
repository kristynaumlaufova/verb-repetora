# Backend
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY BE/ .
RUN dotnet restore BE.csproj
RUN dotnet publish BE.csproj -c Release -o /app

# Frontend
FROM node:16 AS frontend
WORKDIR /frontend
COPY fe/ .
RUN npm install
RUN npm run build

# Final image
FROM base AS final
WORKDIR /app
COPY --from=build /app .
COPY --from=frontend /frontend/build ./wwwroot
ENTRYPOINT ["dotnet", "BE.dll"]