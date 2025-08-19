# Background Agent for 366 Lesson Processing

This guide explains how to set up and run a background agent that processes all 366 lessons with detailed script generation, one by one (no batch processing).

## 🚀 Quick Start

### 1. Start the Background Agent

```bash
# Start the agent (runs in background)
node lesson-agent-monitor.js start

# OR run directly
node background-lesson-agent.js
```

### 2. Monitor Progress

```bash
# Check current status
node lesson-agent-monitor.js status

# Watch progress in real-time
node lesson-agent-monitor.js watch

# Analyze generated lessons
node lesson-agent-monitor.js analyze
```

### 3. Control the Agent

```bash
# Stop the agent gracefully
node lesson-agent-monitor.js stop

# Clean up files when done
node lesson-agent-monitor.js cleanup
```

## 📁 File Structure

The background agent creates the following files:

```
/workspace/
├── background-lesson-agent.js      # Main background agent script
├── lesson-agent-monitor.js         # Monitor and control script
├── lesson-agent-progress.json      # Progress tracking (auto-created)
├── lesson-agent.log               # Detailed logs (auto-created)
└── generated-lessons/             # Output directory (auto-created)
    ├── lesson-001.json            # Generated lesson files
    ├── lesson-002.json
    ├── ...
    ├── lesson-366.json
    └── final-report.json          # Summary report
```

## 🎯 Features

### ✅ One-by-One Processing
- Processes lessons sequentially (no batch processing)
- Each lesson is fully completed before moving to the next
- Prevents system overload and ensures quality

### ✅ Detailed Script Generation
- Generates comprehensive scripts for all 5 phases:
  - Welcome Phase (30s)
  - Beginning Phase (120s) 
  - Middle Phase (180s)
  - End Phase (120s)
  - Wisdom Phase (60s)

### ✅ Variant Generation
- Creates variants for 8 age groups (6, 12, 18, 25, 35, 50, 65, 80)
- 3 tones (neutral, fun, grandmother)
- 2 avatars (Kelly, Kyle)
- **Total: 48 variants per lesson × 366 lessons = 17,568 total variants**

### ✅ Progress Tracking
- Saves progress every 10 lessons
- Resumes from last completed lesson if interrupted
- Tracks processing time and success rates

### ✅ Error Handling
- Retries failed lessons up to 3 times
- Logs all errors for debugging
- Continues processing even if some lessons fail

### ✅ Monitoring & Control
- Real-time progress monitoring
- Graceful shutdown capabilities
- Detailed logging and reporting

## 🔧 Configuration

Edit the configuration in `background-lesson-agent.js`:

```javascript
this.config = {
    outputDir: './generated-lessons',           // Where to save lessons
    progressFile: './lesson-agent-progress.json', // Progress tracking
    logFile: './lesson-agent.log',             // Detailed logs
    retryAttempts: 3,                          // Retry failed lessons
    retryDelay: 5000,                          // Wait 5s between retries
    saveInterval: 10,                          // Save progress every 10 lessons
    enableDetailedScripts: true,               // Generate detailed scripts
    enableAudioGeneration: false,              // Audio generation (optional)
    enableVariantGeneration: true              // Generate all variants
};
```

## 📊 Monitoring Commands

### Check Status
```bash
node lesson-agent-monitor.js status
```
Shows current progress, completion percentage, and recent lessons.

### Watch Real-Time
```bash
node lesson-agent-monitor.js watch
```
Updates progress every 10 seconds. Press Ctrl+C to stop watching.

### Analyze Results
```bash
node lesson-agent-monitor.js analyze
```
Analyzes generated lesson files and shows structure/quality metrics.

## 🛠️ Troubleshooting

### Agent Won't Start
1. Check if Node.js dependencies are installed:
   ```bash
   npm install
   ```

2. Verify curriculum files exist:
   ```bash
   ls -la complete-curriculum.js
   ```

### Agent Stops Unexpectedly
1. Check the log file:
   ```bash
   tail -f lesson-agent.log
   ```

2. Check progress file:
   ```bash
   cat lesson-agent-progress.json
   ```

3. Resume from last position:
   ```bash
   node background-lesson-agent.js
   ```

### High Memory Usage
The agent processes lessons one by one to minimize memory usage, but if you experience issues:

1. Reduce variant generation:
   ```javascript
   enableVariantGeneration: false
   ```

2. Increase save interval:
   ```javascript
   saveInterval: 5  // Save every 5 lessons instead of 10
   ```

## 📈 Expected Performance

### Processing Time
- **Per Lesson**: ~2-5 seconds (depending on complexity)
- **With Variants**: ~10-15 seconds per lesson
- **Total Estimated Time**: 1.5-3 hours for all 366 lessons

### Output Size
- **Per Lesson**: ~50-200KB (depending on variants)
- **Total Output**: ~20-75MB for all lessons
- **Variants**: 17,568 total variants across all lessons

## 🎯 Integration with Existing System

The background agent integrates seamlessly with your existing codebase:

- Uses `complete-curriculum.js` for lesson data
- Integrates with DNA file system
- Compatible with existing lesson player
- Works with variant generation system
- Maintains existing file structure

## 🚦 Running in Production

For production use:

1. **Start the agent:**
   ```bash
   nohup node background-lesson-agent.js > agent-output.log 2>&1 &
   ```

2. **Monitor remotely:**
   ```bash
   node lesson-agent-monitor.js status
   ```

3. **Check logs:**
   ```bash
   tail -f lesson-agent.log
   ```

## 📞 Support

If you encounter issues:

1. Check the log file for detailed error messages
2. Verify all dependencies are installed
3. Ensure sufficient disk space (75MB+ recommended)
4. Check that curriculum files are accessible

The background agent is designed to be robust and resumable, so you can safely stop and restart it as needed.