# Background Lesson Processor - User Guide

This background agent processes all 366 lessons from the iLearnHow curriculum one by one, generating detailed scripts with all variants for each lesson.

## 🚀 Quick Start

### Running the Background Agent

1. **Start in foreground mode (recommended for first run):**
   ```bash
   ./run-background-agent.sh
   ```

2. **Start as background daemon:**
   ```bash
   ./run-background-agent.sh --daemon
   ```

3. **Resume from last checkpoint:**
   ```bash
   ./run-background-agent.sh --daemon --resume
   ```

### Monitoring Progress

1. **Single status check:**
   ```bash
   node monitor-lesson-processing.js
   ```

2. **Continuous monitoring (updates every 5 seconds):**
   ```bash
   node monitor-lesson-processing.js --continuous
   ```

## 📁 File Structure

- `background-lesson-processor.js` - Main processor script
- `run-background-agent.sh` - Shell script to run the processor
- `monitor-lesson-processing.js` - Monitoring tool
- `lesson-processing-progress.json` - Progress tracking file (auto-generated)
- `lesson-processing-errors.log` - Error log file (auto-generated)
- `generated-lessons/` - Output directory for generated scripts

## 🔧 Features

### One-by-One Processing
- Processes each lesson individually with a 2-second delay between lessons
- No batch processing - ensures quality and allows for monitoring

### Progress Tracking
- Automatically saves progress after every 10 lessons
- Can resume from the last processed lesson if interrupted
- Tracks both successful and failed lessons

### Error Handling
- Retries failed lessons up to 3 times
- Logs all errors to `lesson-processing-errors.log`
- Continues processing even if individual lessons fail

### Generated Content
For each lesson, the processor generates:
- **30 variants per lesson** (10 ages × 3 tones)
- Ages: 2, 5, 8, 12, 16, 25, 40, 60, 80, 102 years old
- Tones: grandmother, fun, neutral
- Introduction, questions, activities, and conclusion for each variant
- Voiceover scripts with age-appropriate modulation
- Avatar mood configurations (Kelly for grandmother/neutral, Ken for fun)
- Estimated duration customized for each age group

## 📊 Output Format

Each generated lesson is saved as a JSON file in the `generated-lessons/` directory with the following structure:

```json
{
  "lessonId": 1,
  "date": "January 1",
  "title": "The Sun - Our Magnificent Life-Giving Star",
  "learningObjective": "...",
  "variants": {
    "age_2": {
      "grandmother": { ... },
      "fun": { ... },
      "neutral": { ... }
    },
    "age_5": { ... },
    "age_8": { ... },
    "age_12": { ... },
    "age_16": { ... },
    "age_25": { ... },
    "age_40": { ... },
    "age_60": { ... },
    "age_80": { ... },
    "age_102": { ... }
  }
}
```

## 🛑 Stopping the Processor

### If running in foreground:
Press `Ctrl+C` - progress will be saved automatically

### If running as daemon:
1. Find the PID:
   ```bash
   cat lesson_processor.pid
   ```

2. Stop the process:
   ```bash
   kill <PID>
   ```

## ⏱️ Time Estimates

- Average processing time per lesson: ~20-30 seconds (30 variants per lesson)
- Total time for 366 lessons: ~2.5-3 hours
- The monitor will show real-time ETR (Estimated Time Remaining)
- Processing includes 10,980 total variants (366 lessons × 30 variants)

## 🔍 Troubleshooting

### Processor won't start
- Check if another instance is running: `cat lesson_processor.pid`
- Remove stale PID file if needed: `rm lesson_processor.pid`

### No progress shown
- Ensure the processor has started and created the progress file
- Check logs in `logs/` directory if running as daemon

### High error rate
- Check `lesson-processing-errors.log` for details
- Ensure all required files are in place (variant generator, curriculum data)
- Verify Node.js version compatibility

## 📈 Performance Tips

1. **Run during off-peak hours** to avoid impacting other processes
2. **Monitor disk space** - each lesson generates a ~50-100KB JSON file
3. **Check error logs regularly** to catch issues early
4. **Use daemon mode** for long runs to prevent terminal disconnection issues

## 🎯 Complete Workflow

1. Start the processor:
   ```bash
   ./run-background-agent.sh --daemon
   ```

2. Monitor progress:
   ```bash
   node monitor-lesson-processing.js --continuous
   ```

3. Check completion:
   ```bash
   ls generated-lessons/ | wc -l
   ```

4. Review any errors:
   ```bash
   cat lesson-processing-errors.log
   ```

## 📊 Age Groups and Variants

The processor generates content for 10 distinct age groups:

| Age ID | Age Group | Description |
|--------|-----------|-------------|
| age_2 | Toddler | Simple, sensory-focused content |
| age_5 | Early Childhood | Playful, story-based learning |
| age_8 | School Age | Hands-on activities and exploration |
| age_12 | Preteen | Identity-forming, challenging content |
| age_16 | Teen | Abstract thinking, peer-oriented |
| age_25 | Young Adult | Practical application focused |
| age_40 | Adult | Leadership and community oriented |
| age_60 | Mature Adult | Wisdom consolidation |
| age_80 | Elder | Philosophical integration |
| age_102 | Centenarian | Transcendent perspective |

Each age group gets 3 tone variants:
- **Grandmother** (Kelly): Warm, nurturing, patient
- **Fun** (Ken): Energetic, enthusiastic, playful
- **Neutral** (Kelly): Clear, educational, professional

## 💡 Notes

- The processor integrates with your existing variant generator
- Each lesson is processed with full error handling and retry logic
- Progress is persistent - you can stop and resume at any time
- Generated files use a consistent naming convention for easy organization
- Total output: 10,980 unique lesson variants across all ages and tones

Happy processing! 🎉