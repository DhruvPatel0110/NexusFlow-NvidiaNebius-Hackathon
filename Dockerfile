FROM python:3.11-slim

WORKDIR /app

# Install essential system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/req.txt /app/req.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r req.txt && \
    python -m spacy download en_core_web_sm

# Copy backend application source
COPY backend /app/backend
COPY run.py /app/run.py

# Ensure data directories exist
RUN mkdir -p /app/backend/data /app/data

# Environment configuration
ENV PYTHONUNBUFFERED=1
ENV OMP_NUM_THREADS=1
ENV PORT=8000

EXPOSE 8000

# Run FastAPI with dynamic port binding (supports HuggingFace 7860, Render, Railway, or Nebius VM)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir backend"]
