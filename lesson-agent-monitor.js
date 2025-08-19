#!/usr/bin/env node

/**
 * Lesson Agent Monitor & Controller
 * 
 * This script provides monitoring, control, and analysis capabilities
 * for the background lesson agent processing all 366 lessons.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class LessonAgentMonitor {
    constructor() {
        this.progressFile = './lesson-agent-progress.json';
        this.logFile = './lesson-agent.log';
        this.outputDir = './generated-lessons';
        this.agentProcess = null;
    }
    
    /**
     * Start the background agent
     */
    async startAgent() {
        console.log('🚀 Starting background lesson agent...');
        
        this.agentProcess = spawn('node', ['background-lesson-agent.js'], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // Handle agent output
        this.agentProcess.stdout.on('data', (data) => {
            console.log(`[AGENT] ${data.toString().trim()}`);
        });
        
        this.agentProcess.stderr.on('data', (data) => {
            console.error(`[AGENT ERROR] ${data.toString().trim()}`);
        });
        
        this.agentProcess.on('close', (code) => {
            console.log(`🏁 Background agent finished with code ${code}`);
            this.agentProcess = null;
        });
        
        // Unref so monitor can exit independently
        this.agentProcess.unref();
        
        console.log(`✅ Background agent started with PID: ${this.agentProcess.pid}`);
        return this.agentProcess.pid;
    }
    
    /**
     * Stop the background agent gracefully
     */
    async stopAgent() {
        if (this.agentProcess) {
            console.log('🛑 Stopping background agent...');
            this.agentProcess.kill('SIGINT');
            
            // Wait for graceful shutdown
            return new Promise((resolve) => {
                this.agentProcess.on('close', () => {
                    console.log('✅ Background agent stopped');
                    resolve();
                });
                
                // Force kill after 10 seconds
                setTimeout(() => {
                    if (this.agentProcess) {
                        this.agentProcess.kill('SIGKILL');
                        console.log('⚡ Background agent force-stopped');
                        resolve();
                    }
                }, 10000);
            });
        } else {
            console.log('ℹ️  No background agent running');
        }
    }
    
    /**
     * Get current progress status
     */
    async getProgress() {
        try {
            const progressData = await fs.readFile(this.progressFile, 'utf8');
            const progress = JSON.parse(progressData);
            
            const stats = {
                current_day: progress.currentDay || 1,
                processed_count: progress.processedCount || 0,
                failed_count: progress.failedCount || 0,
                completion_percentage: ((progress.processedCount || 0) / 366 * 100).toFixed(2),
                last_updated: progress.lastSaved || 'Never',
                estimated_remaining_time: this.estimateRemainingTime(progress)
            };
            
            return { progress, stats };
        } catch (error) {
            return {
                progress: null,
                stats: {
                    current_day: 1,
                    processed_count: 0,
                    failed_count: 0,
                    completion_percentage: '0.00',
                    last_updated: 'Never',
                    estimated_remaining_time: 'Unknown'
                }
            };
        }
    }
    
    /**
     * Display real-time progress
     */
    async showProgress() {
        const { progress, stats } = await this.getProgress();
        
        console.log('\n📊 BACKGROUND AGENT PROGRESS REPORT');
        console.log('=====================================');
        console.log(`📅 Current Day: ${stats.current_day}/366`);
        console.log(`✅ Processed: ${stats.processed_count} lessons`);
        console.log(`❌ Failed: ${stats.failed_count} lessons`);
        console.log(`📈 Progress: ${stats.completion_percentage}%`);
        console.log(`🕒 Last Updated: ${stats.last_updated}`);
        console.log(`⏱️  Estimated Remaining: ${stats.estimated_remaining_time}`);
        
        if (progress && progress.processedLessons && progress.processedLessons.length > 0) {
            const recentLessons = progress.processedLessons.slice(-5);
            console.log('\n📚 Recent Lessons:');
            recentLessons.forEach(lesson => {
                console.log(`  Day ${lesson.day}: ${lesson.title} (${Math.round(lesson.processingTime)}ms, ${lesson.variantCount} variants)`);
            });
        }
        
        if (progress && progress.failedLessons && progress.failedLessons.length > 0) {
            console.log('\n❌ Failed Lessons:');
            progress.failedLessons.forEach(lesson => {
                console.log(`  Day ${lesson.day}: ${lesson.error}`);
            });
        }
        
        console.log('=====================================\n');
    }
    
    /**
     * Watch progress in real-time
     */
    async watchProgress() {
        console.log('👁️  Watching background agent progress (Ctrl+C to stop)...\n');
        
        const watchInterval = setInterval(async () => {
            await this.showProgress();
        }, 10000); // Update every 10 seconds
        
        // Handle Ctrl+C
        process.on('SIGINT', () => {
            clearInterval(watchInterval);
            console.log('\n👋 Stopping progress monitor...');
            process.exit(0);
        });
    }
    
    /**
     * Analyze generated lessons
     */
    async analyzeLessons() {
        console.log('🔍 Analyzing generated lessons...');
        
        try {
            const files = await fs.readdir(this.outputDir);
            const lessonFiles = files.filter(f => f.startsWith('lesson-') && f.endsWith('.json'));
            
            console.log(`\n📁 Found ${lessonFiles.length} generated lesson files`);
            
            if (lessonFiles.length === 0) {
                console.log('ℹ️  No lessons generated yet');
                return;
            }
            
            // Analyze a sample of lessons
            const sampleSize = Math.min(5, lessonFiles.length);
            const sampleFiles = lessonFiles.slice(0, sampleSize);
            
            console.log(`\n🔬 Analyzing sample of ${sampleSize} lessons:`);
            
            for (const filename of sampleFiles) {
                const filepath = path.join(this.outputDir, filename);
                const lessonData = JSON.parse(await fs.readFile(filepath, 'utf8'));
                
                console.log(`\n📖 ${filename}:`);
                console.log(`  Title: ${lessonData.title}`);
                console.log(`  Phases: ${Object.keys(lessonData.scripts || {}).length}`);
                console.log(`  Variants: ${Object.keys(lessonData.variants || {}).length}`);
                console.log(`  Complexity: ${lessonData.production_notes?.complexity_level || 'Unknown'}`);
                console.log(`  Duration: ${lessonData.production_notes?.total_duration_seconds || 'Unknown'}s`);
            }
            
        } catch (error) {
            console.error(`❌ Analysis failed: ${error.message}`);
        }
    }
    
    /**
     * Resume failed lessons only
     */
    async resumeFailedLessons() {
        const { progress } = await this.getProgress();
        
        if (!progress || !progress.failedLessons || progress.failedLessons.length === 0) {
            console.log('ℹ️  No failed lessons to resume');
            return;
        }
        
        console.log(`🔄 Found ${progress.failedLessons.length} failed lessons to retry`);
        
        // Create a custom agent run for just the failed lessons
        const failedDays = progress.failedLessons.map(lesson => lesson.day);
        console.log(`📝 Failed days: ${failedDays.join(', ')}`);
        
        // This would require modifying the agent to accept specific days
        console.log('💡 To resume failed lessons, restart the agent - it will skip completed ones');
    }
    
    /**
     * Clean up generated files
     */
    async cleanup() {
        console.log('🧹 Cleaning up generated files...');
        
        try {
            // Remove progress file
            await fs.unlink(this.progressFile);
            console.log('✅ Removed progress file');
        } catch (error) {
            console.log('ℹ️  No progress file to remove');
        }
        
        try {
            // Remove log file
            await fs.unlink(this.logFile);
            console.log('✅ Removed log file');
        } catch (error) {
            console.log('ℹ️  No log file to remove');
        }
        
        // Ask about generated lessons
        console.log('⚠️  Generated lesson files are preserved in:', this.outputDir);
        console.log('💡 Use "rm -rf generated-lessons" to remove them if needed');
    }
    
    /**
     * Estimate remaining time based on current progress
     */
    estimateRemainingTime(progress) {
        if (!progress.processedLessons || progress.processedLessons.length === 0) {
            return 'Unknown';
        }
        
        const avgTimePerLesson = progress.processedLessons.reduce((sum, lesson) => 
            sum + lesson.processingTime, 0) / progress.processedLessons.length;
        
        const remainingLessons = 366 - progress.processedCount;
        const estimatedMs = remainingLessons * avgTimePerLesson;
        
        const hours = Math.floor(estimatedMs / (1000 * 60 * 60));
        const minutes = Math.floor((estimatedMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
    
    /**
     * Display help information
     */
    showHelp() {
        console.log('\n🤖 Lesson Agent Monitor - Command Reference');
        console.log('==========================================');
        console.log('');
        console.log('Usage: node lesson-agent-monitor.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  start     - Start the background lesson agent');
        console.log('  stop      - Stop the running background agent');
        console.log('  status    - Show current progress status');
        console.log('  watch     - Watch progress in real-time');
        console.log('  analyze   - Analyze generated lessons');
        console.log('  resume    - Resume failed lessons');
        console.log('  cleanup   - Clean up progress and log files');
        console.log('  help      - Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node lesson-agent-monitor.js start');
        console.log('  node lesson-agent-monitor.js watch');
        console.log('  node lesson-agent-monitor.js status');
        console.log('');
    }
}

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

async function main() {
    const monitor = new LessonAgentMonitor();
    const command = process.argv[2] || 'help';
    
    switch (command) {
        case 'start':
            await monitor.startAgent();
            break;
            
        case 'stop':
            await monitor.stopAgent();
            break;
            
        case 'status':
            await monitor.showProgress();
            break;
            
        case 'watch':
            await monitor.watchProgress();
            break;
            
        case 'analyze':
            await monitor.analyzeLessons();
            break;
            
        case 'resume':
            await monitor.resumeFailedLessons();
            break;
            
        case 'cleanup':
            await monitor.cleanup();
            break;
            
        case 'help':
        default:
            monitor.showHelp();
            break;
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Monitor failed:', error);
        process.exit(1);
    });
}

module.exports = { LessonAgentMonitor };