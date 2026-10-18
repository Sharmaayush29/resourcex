# Multi-stage / lightweight secure production Dockerfile for FastAPI
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/documents uploads/evidence uploads/images

# Expose port
EXPOSE 8000

# Run uvicorn server binding to 0.0.0.0
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
