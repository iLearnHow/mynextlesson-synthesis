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

# Copy ONLY the production server - force Railway to use it
COPY production-tts-server.py .

# Environment
ENV PYTHONUNBUFFERED=1
ENV PORT=5002
ENV COQUI_TOS_AGREED=1
ENV FLASK_ENV=production

# Expose port
EXPOSE 5002

# Force Railway to use our new production server
CMD ["python", "production-tts-server.py"]
