#!/usr/bin/env node

/**
 * Monitor script for Background Lesson Processing
 * Provides real-time status updates and progress information
 */

const fs = require('fs').promises;
const path = require('path');

class LessonProcessingMonitor {
    constructor() {
        this.progressFile = path.join(__dirname, 'lesson-processing-progress.json');
        this.outputDir = path.join(__dirname, 'generated-lessons');
        this.errorLogFile = path.join(__dirname, 'lesson-processing-errors.log');
        this.pidFile = path.join(__dirname, 'lesson_processor.pid');
    }
    
    /**
     * Check if processor is running
     */
    async isProcessorRunning() {
        try {
            const pidData = await fs.readFile(this.pidFile, 'utf8');
            const pid = parseInt(pidData.trim());
            
            // Check if process exists
            try {
                process.kill(pid, 0);
                return { running: true, pid };
            } catch (e) {
                return { running: false, pid: null };
            }
        } catch (error) {
            return { running: false, pid: null };
        }
    }
    
    /**
     * Load progress data
     */
    async loadProgress() {
        try {
            const data = await fs.readFile(this.progressFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Count generated files
     */
    async countGeneratedFiles() {
        try {
            const files = await fs.readdir(this.outputDir);
            return files.filter(f => f.endsWith('.json')).length;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Get error count
     */
    async getErrorInfo() {
        try {
            const data = await fs.readFile(this.errorLogFile, 'utf8');
            const errorCount = (data.match(/\[.*?\] Lesson/g) || []).length;
            return { exists: true, count: errorCount };
        } catch (error) {
            return { exists: false, count: 0 };
        }
    }
    
    /**
     * Format duration
     */
    formatDuration(startTime, endTime = null) {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const duration = end - start;
        
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    
    /**
     * Calculate estimated time remaining
     */
    calculateETR(progress) {
        if (!progress.processedLessons || progress.processedLessons.length === 0) {
            return 'N/A';
        }
        
        const totalLessons = 366;
        const processed = progress.processedLessons.length;
        const remaining = totalLessons - processed;
        
        if (remaining === 0) return 'Complete';
        
        const elapsedMs = new Date() - new Date(progress.startTime);
        const avgTimePerLesson = elapsedMs / processed;
        const remainingMs = remaining * avgTimePerLesson;
        
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
    
    /**
     * Display progress bar
     */
    displayProgressBar(current, total, width = 40) {
        const percentage = (current / total) * 100;
        const filled = Math.floor((current / total) * width);
        const empty = width - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `[${bar}] ${percentage.toFixed(1)}%`;
    }
    
    /**
     * Display monitoring information
     */
    async displayStatus() {
        console.clear();
        console.log('📊 LESSON PROCESSING MONITOR');
        console.log('=' .repeat(60));
        console.log();
        
        // Check if processor is running
        const processStatus = await this.isProcessorRunning();
        if (processStatus.running) {
            console.log(`🟢 Status: RUNNING (PID: ${processStatus.pid})`);
        } else {
            console.log('🔴 Status: NOT RUNNING');
        }
        console.log();
        
        // Load progress
        const progress = await this.loadProgress();
        if (!progress) {
            console.log('❌ No progress file found. Processor may not have started yet.');
            return;
        }
        
        // Basic statistics
        const totalLessons = 366;
        const processedCount = progress.processedLessons ? progress.processedLessons.length : 0;
        const errorCount = progress.errors ? progress.errors.length : 0;
        const fileCount = await this.countGeneratedFiles();
        
        console.log('📈 PROGRESS');
        console.log('-'.repeat(60));
        console.log(`Total Lessons:     ${totalLessons}`);
        console.log(`Processed:         ${processedCount}`);
        console.log(`Errors:            ${errorCount}`);
        console.log(`Generated Files:   ${fileCount}`);
        console.log();
        
        // Progress bar
        console.log(this.displayProgressBar(processedCount, totalLessons));
        console.log();
        
        // Time statistics
        console.log('⏱️  TIME');
        console.log('-'.repeat(60));
        console.log(`Started:           ${new Date(progress.startTime).toLocaleString()}`);
        console.log(`Duration:          ${this.formatDuration(progress.startTime, progress.completedAt)}`);
        console.log(`ETR:               ${this.calculateETR(progress)}`);
        
        if (progress.completedAt) {
            console.log(`Completed:         ${new Date(progress.completedAt).toLocaleString()}`);
        }
        console.log();
        
        // Recent activity
        if (progress.processedLessons && progress.processedLessons.length > 0) {
            console.log('📝 RECENT ACTIVITY');
            console.log('-'.repeat(60));
            
            const recent = progress.processedLessons.slice(-5);
            recent.forEach(lesson => {
                const time = new Date(lesson.processedAt).toLocaleTimeString();
                console.log(`[${time}] Day ${lesson.globalDay}: ${lesson.title.substring(0, 40)}...`);
            });
            console.log();
        }
        
        // Recent errors
        if (progress.errors && progress.errors.length > 0) {
            console.log('⚠️  RECENT ERRORS');
            console.log('-'.repeat(60));
            
            const recentErrors = progress.errors.slice(-3);
            recentErrors.forEach(error => {
                const time = new Date(error.timestamp).toLocaleTimeString();
                console.log(`[${time}] Day ${error.globalDay}: ${error.error}`);
            });
            console.log();
        }
        
        // Performance metrics
        if (processedCount > 0) {
            const elapsedMs = new Date() - new Date(progress.startTime);
            const avgTimePerLesson = elapsedMs / processedCount / 1000; // in seconds
            const lessonsPerHour = (processedCount / (elapsedMs / (1000 * 60 * 60))).toFixed(1);
            
            console.log('📊 PERFORMANCE');
            console.log('-'.repeat(60));
            console.log(`Avg Time/Lesson:   ${avgTimePerLesson.toFixed(1)}s`);
            console.log(`Lessons/Hour:      ${lessonsPerHour}`);
            console.log(`Success Rate:      ${((processedCount / (processedCount + errorCount)) * 100).toFixed(1)}%`);
        }
    }
    
    /**
     * Run continuous monitoring
     */
    async runContinuousMonitoring(interval = 5000) {
        console.log('Starting continuous monitoring... (Press Ctrl+C to stop)');
        
        // Initial display
        await this.displayStatus();
        
        // Set up interval
        const intervalId = setInterval(async () => {
            await this.displayStatus();
        }, interval);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            clearInterval(intervalId);
            console.log('\n\n👋 Monitoring stopped');
            process.exit(0);
        });
    }
    
    /**
     * Run single status check
     */
    async runSingleCheck() {
        await this.displayStatus();
        
        const errorInfo = await this.getErrorInfo();
        if (errorInfo.exists && errorInfo.count > 0) {
            console.log(`\n💡 Tip: Check ${this.errorLogFile} for detailed error information`);
        }
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const continuous = args.includes('--continuous') || args.includes('-c');
const help = args.includes('--help') || args.includes('-h');

if (help) {
    console.log('Usage: node monitor-lesson-processing.js [options]');
    console.log('Options:');
    console.log('  -c, --continuous    Run continuous monitoring (updates every 5 seconds)');
    console.log('  -h, --help         Display this help message');
    process.exit(0);
}

// Create and run monitor
const monitor = new LessonProcessingMonitor();

if (continuous) {
    monitor.runContinuousMonitoring();
} else {
    monitor.runSingleCheck();
}