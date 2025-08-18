# FORCE RAILWAY REBUILD - COMPLETELY NEW DOCKERFILE
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ONLY the new Railway TTS server - nothing else
COPY railway-tts-server.py .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=5002
ENV COQUI_TOS_AGREED=1
ENV FLASK_ENV=production

# Expose port
EXPOSE 5002

# Force Railway to use our NEW server
CMD ["python", "railway-tts-server.py"]
