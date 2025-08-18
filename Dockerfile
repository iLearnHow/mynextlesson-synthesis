FROM python:3.9-slim

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

# Copy application files
COPY production-tts-server.py .
COPY emergency-tts-fix.py .
COPY hybrid_tts_server_with_phonemes.py .

# Environment
ENV PYTHONUNBUFFERED=1
ENV PORT=5002
ENV COQUI_TOS_AGREED=1
ENV FLASK_ENV=production

# Expose port
EXPOSE 5002

# Run server (model will download on first run)
CMD ["python", "production-tts-server.py"]
