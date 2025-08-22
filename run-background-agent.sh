#!/bin/bash

# Background Agent Runner for Lesson Processing
# This script runs the lesson processor in the background with proper logging

echo "🚀 Starting Background Lesson Processor"
echo "===================================="
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Get current timestamp for log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="logs/lesson_processor_${TIMESTAMP}.log"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Function to display usage
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -d, --daemon     Run as daemon (background process)"
    echo "  -f, --foreground Run in foreground (default)"
    echo "  -r, --resume     Resume from last checkpoint"
    echo "  -h, --help       Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run in foreground"
    echo "  $0 --daemon           # Run as background daemon"
    echo "  $0 --daemon --resume  # Resume processing in background"
}

# Parse command line arguments
RUN_MODE="foreground"
RESUME_FLAG=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--daemon)
            RUN_MODE="daemon"
            shift
            ;;
        -f|--foreground)
            RUN_MODE="foreground"
            shift
            ;;
        -r|--resume)
            RESUME_FLAG="--resume"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check if processor file exists
if [ ! -f "background-lesson-processor.js" ]; then
    echo "❌ Error: background-lesson-processor.js not found"
    echo "Make sure you're running this script from the correct directory"
    exit 1
fi

# Check if another instance is already running
PID_FILE="lesson_processor.pid"
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Warning: Lesson processor is already running (PID: $OLD_PID)"
        echo "To stop it, run: kill $OLD_PID"
        exit 1
    else
        echo "🧹 Cleaning up stale PID file"
        rm "$PID_FILE"
    fi
fi

if [ "$RUN_MODE" = "daemon" ]; then
    echo "📋 Starting lesson processor as background daemon..."
    echo "📝 Logs will be written to: $LOG_FILE"
    echo ""
    
    # Run in background using nohup
    nohup node background-lesson-processor.js $RESUME_FLAG > "$LOG_FILE" 2>&1 &
    
    # Get the PID
    PID=$!
    echo $PID > "$PID_FILE"
    
    echo "✅ Background processor started with PID: $PID"
    echo ""
    echo "📊 Monitor progress with:"
    echo "   tail -f $LOG_FILE"
    echo ""
    echo "🛑 To stop the processor:"
    echo "   kill $PID"
    echo ""
    echo "📈 To check progress:"
    echo "   cat lesson-processing-progress.json | jq '.processedLessons | length'"
    echo ""
else
    echo "📋 Starting lesson processor in foreground..."
    echo "Press Ctrl+C to stop (progress will be saved)"
    echo ""
    
    # Run in foreground
    node background-lesson-processor.js $RESUME_FLAG
fi