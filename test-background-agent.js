#!/usr/bin/env node

/**
 * Test Script for Background Lesson Agent
 * 
 * This script tests the background agent with a small subset of lessons
 * to verify everything works before running the full 366-lesson process.
 */

const fs = require('fs').promises;
const path = require('path');
const { BackgroundLessonAgent } = require('./background-lesson-agent.js');

class BackgroundAgentTester {
    constructor() {
        this.testOutputDir = './test-generated-lessons';
        this.testLessons = [1, 50, 100, 200, 366]; // Sample lessons across the year
    }
    
    /**
     * Run comprehensive test of the background agent
     */
    async runTests() {
        console.log('🧪 Testing Background Lesson Agent');
        console.log('==================================\n');
        
        // Test 1: Basic initialization
        console.log('Test 1: Agent Initialization');
        await this.testInitialization();
        
        // Test 2: Single lesson processing
        console.log('\nTest 2: Single Lesson Processing');
        await this.testSingleLesson();
        
        // Test 3: Multiple lesson processing
        console.log('\nTest 3: Multiple Lesson Processing');
        await this.testMultipleLessons();
        
        // Test 4: Progress tracking
        console.log('\nTest 4: Progress Tracking');
        await this.testProgressTracking();
        
        // Test 5: Error handling
        console.log('\nTest 5: Error Handling');
        await this.testErrorHandling();
        
        console.log('\n🎉 All tests completed!');
        console.log('\n💡 If all tests passed, you can run the full agent with:');
        console.log('   node lesson-agent-monitor.js start');
        console.log('   node lesson-agent-monitor.js watch');
    }
    
    /**
     * Test agent initialization
     */
    async testInitialization() {
        try {
            const agent = new BackgroundLessonAgent();
            
            // Override config for testing
            agent.config.outputDir = this.testOutputDir;
            agent.config.progressFile = './test-progress.json';
            agent.config.logFile = './test-agent.log';
            
            await agent.initializeComponents();
            
            // Check if test directory was created
            const stats = await fs.stat(this.testOutputDir);
            if (stats.isDirectory()) {
                console.log('✅ Agent initialization successful');
                console.log(`   📁 Test output directory created: ${this.testOutputDir}`);
            } else {
                throw new Error('Output directory not created');
            }
            
        } catch (error) {
            console.log(`❌ Agent initialization failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Test processing a single lesson
     */
    async testSingleLesson() {
        try {
            const agent = new BackgroundLessonAgent();
            agent.config.outputDir = this.testOutputDir;
            agent.config.progressFile = './test-progress.json';
            agent.config.logFile = './test-agent.log';
            
            await agent.initializeComponents();
            
            // Process lesson 1
            await agent.processLesson(1);
            
            // Check if lesson file was created
            const lessonFile = path.join(this.testOutputDir, 'lesson-001.json');
            const lessonData = JSON.parse(await fs.readFile(lessonFile, 'utf8'));
            
            console.log('✅ Single lesson processing successful');
            console.log(`   📖 Title: ${lessonData.title}`);
            console.log(`   🎭 Scripts: ${Object.keys(lessonData.scripts || {}).length} phases`);
            console.log(`   🎨 Variants: ${Object.keys(lessonData.variants || {}).length} variants`);
            
        } catch (error) {
            console.log(`❌ Single lesson processing failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Test processing multiple lessons
     */
    async testMultipleLessons() {
        try {
            const agent = new BackgroundLessonAgent();
            agent.config.outputDir = this.testOutputDir;
            agent.config.progressFile = './test-progress.json';
            agent.config.logFile = './test-agent.log';
            agent.config.saveInterval = 2; // Save every 2 lessons for testing
            
            await agent.initializeComponents();
            
            // Process first 3 lessons
            agent.currentDay = 1;
            agent.totalLessons = 3; // Override for testing
            
            for (let day = 1; day <= 3; day++) {
                await agent.processLesson(day);
            }
            
            // Save progress for testing
            await agent.saveProgress();
            
            console.log('✅ Multiple lesson processing successful');
            console.log(`   📚 Processed lessons: ${agent.processedLessons.length}`);
            console.log(`   ❌ Failed lessons: ${agent.failedLessons.length}`);
            
        } catch (error) {
            console.log(`❌ Multiple lesson processing failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Test progress tracking
     */
    async testProgressTracking() {
        try {
            // Check if progress file exists and is valid
            const progressData = await fs.readFile('./test-progress.json', 'utf8');
            const progress = JSON.parse(progressData);
            
            console.log('✅ Progress tracking successful');
            console.log(`   📊 Current day: ${progress.currentDay}`);
            console.log(`   ✅ Processed: ${progress.processedCount} lessons`);
            console.log(`   📅 Last saved: ${progress.lastSaved}`);
            
        } catch (error) {
            console.log(`❌ Progress tracking failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Test error handling
     */
    async testErrorHandling() {
        try {
            const agent = new BackgroundLessonAgent();
            agent.config.outputDir = this.testOutputDir;
            agent.config.retryAttempts = 2; // Reduce for testing
            
            // Test with invalid lesson day
            try {
                await agent.processLesson(999); // Invalid day
                console.log('❌ Error handling failed: should have thrown error for invalid day');
            } catch (error) {
                console.log('✅ Error handling successful');
                console.log(`   🛡️  Correctly caught error: ${error.message.substring(0, 50)}...`);
            }
            
        } catch (error) {
            console.log(`❌ Error handling test failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Clean up test files
     */
    async cleanup() {
        console.log('\n🧹 Cleaning up test files...');
        
        try {
            // Remove test directory
            await fs.rm(this.testOutputDir, { recursive: true, force: true });
            console.log('✅ Removed test output directory');
        } catch (error) {
            console.log('ℹ️  Test output directory already cleaned');
        }
        
        try {
            // Remove test progress file
            await fs.unlink('./test-progress.json');
            console.log('✅ Removed test progress file');
        } catch (error) {
            console.log('ℹ️  Test progress file already cleaned');
        }
        
        try {
            // Remove test log file
            await fs.unlink('./test-agent.log');
            console.log('✅ Removed test log file');
        } catch (error) {
            console.log('ℹ️  Test log file already cleaned');
        }
    }
}

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

async function main() {
    const tester = new BackgroundAgentTester();
    const command = process.argv[2] || 'test';
    
    if (command === 'cleanup') {
        await tester.cleanup();
        return;
    }
    
    try {
        await tester.runTests();
        await tester.cleanup();
    } catch (error) {
        console.error('\n💥 Test suite failed:', error.message);
        console.log('\n🔧 Try these troubleshooting steps:');
        console.log('1. Ensure complete-curriculum.js exists');
        console.log('2. Check Node.js dependencies: npm install');
        console.log('3. Verify file permissions');
        console.log('4. Check available disk space');
        
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { BackgroundAgentTester };