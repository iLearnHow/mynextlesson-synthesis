# 🎭 Viseme Expansion Pipeline for Kelly & Ken

## Overview

This project expands the avatar viseme system from 12 basic visemes to 48 comprehensive visemes, including emotional and contextual variants. The system extracts frames from training videos, enhances them with AI processing, and integrates them into the existing avatar synchronization system.

## 🎯 What We've Built

### **Enhanced Viseme System (48 Total)**

#### **1. Basic Visemes (12) - Original Set**
- `REST`, `MBP`, `FV`, `TH`, `DNTL`, `KG`, `S`, `WQ`, `R`, `A`, `E`, `I`

#### **2. Enhanced Visemes (12) - New Additions**
- `OO`, `UH`, `AW`, `AY`, `OY`, `NG`, `CH`, `SH`, `ZH`, `Y`, `L`, `H`

#### **3. Emotional Variants (9) - Key Vowels with Emotions**
- `A_HAPPY`, `A_SERIOUS`, `A_EXCITED`
- `E_HAPPY`, `E_SERIOUS`, `E_EXCITED`
- `I_HAPPY`, `I_SERIOUS`, `I_EXCITED`

#### **4. Contextual Variants (9) - Teaching Scenarios**
- `A_TEACH`, `A_QUESTION`, `A_EMPHASIS`
- `E_TEACH`, `E_QUESTION`, `E_EMPHASIS`
- `I_TEACH`, `I_QUESTION`, `I_EMPHASIS`

## 🏗️ Architecture

### **File Structure**
```
ilearn_how/
├── viseme-expansion-pipeline.py      # Main expansion pipeline
├── enhanced-avatar-sync-player.js    # Enhanced player with 48 visemes
├── test-enhanced-visemes.html        # Test interface
├── requirements-viseme.txt           # Python dependencies
└── production-deploy/assets/avatars/
    ├── kelly/2d/
    │   ├── visemes/
    │   │   ├── basic/               # 12 original visemes
    │   │   ├── enhanced/            # 12 new visemes
    │   │   ├── emotional/           # 9 emotional variants
    │   │   └── contextual/          # 9 contextual variants
    │   ├── rig.json                 # Updated with 48 visemes
    │   └── metadata/
    │       └── viseme_mapping.json  # Phoneme mapping
    └── ken/2d/
        ├── visemes/
        │   ├── basic/               # 12 original visemes
        │   ├── enhanced/            # 12 new visemes
        │   ├── emotional/           # 9 emotional variants
        │   └── contextual/          # 9 contextual variants
        ├── rig.json                 # Updated with 48 visemes
        └── metadata/
            └── viseme_mapping.json  # Phoneme mapping
```

### **Core Components**

#### **1. Viseme Expansion Pipeline (`viseme-expansion-pipeline.py`)**
- **Frame Extraction**: Extracts optimal frames from training videos
- **AI Enhancement**: Improves frame quality and consistency
- **Variant Generation**: Creates emotional and contextual variations
- **Metadata Creation**: Generates comprehensive viseme mappings
- **Rig Updates**: Updates rig.json files with new viseme definitions

#### **2. Enhanced Avatar Sync Player (`enhanced-avatar-sync-player.js`)**
- **48-Viseme Support**: Handles all expanded viseme categories
- **Emotional Intelligence**: Automatically detects and applies emotional variants
- **Context Awareness**: Applies appropriate contextual variants for teaching scenarios
- **Smart Fallbacks**: Gracefully falls back to basic visemes when enhanced versions unavailable
- **Performance Optimization**: Efficient preloading and caching of viseme frames

#### **3. Test Interface (`test-enhanced-visemes.html`)**
- **Interactive Testing**: Test both Kelly and Ken avatars
- **Emotion Control**: Manually set emotional states
- **Context Selection**: Choose teaching scenarios
- **Real-time Stats**: Monitor viseme system performance
- **Visual Feedback**: See avatar responses in real-time

## 🚀 Getting Started

### **Prerequisites**
```bash
# Install Python dependencies
pip install -r requirements-viseme.txt

# Ensure training videos are available
ls critical-foundations/*.mp4
```

### **Step 1: Run the Expansion Pipeline**
```bash
# Process both Kelly and Ken
python3 viseme-expansion-pipeline.py

# Or process specific speaker
python3 viseme-expansion-pipeline.py --speaker kelly
python3 viseme-expansion-pipeline.py --speaker ken

# Custom base path
python3 viseme-expansion-pipeline.py --base-path custom/path/to/avatars
```

### **Step 2: Test the Enhanced System**
```bash
# Open the test interface
open test-enhanced-visemes.html
# or
python3 -m http.server 8000
# Then visit http://localhost:8000/test-enhanced-visemes.html
```

### **Step 3: Integrate with Existing System**
```javascript
// Replace existing avatar sync player with enhanced version
import { EnhancedAvatarSyncPlayer } from './enhanced-avatar-sync-player.js';

// Initialize enhanced player
const player = new EnhancedAvatarSyncPlayer();

// Use enhanced features
await player.play("Hello! This is amazing!", "kelly", "excited", "teach");
```

## 🔧 Configuration

### **Training Video Paths**
The pipeline automatically looks for training videos in:
- `critical-foundations/kelly2.mp4`
- `critical-foundations/kelly2 (1).mp4`
- `critical-foundations/ken2.mp4`
- `critical-foundations/ken2 (1).mp4`

### **Output Directory Structure**
The pipeline creates organized viseme directories:
- `basic/` - Original 12 visemes
- `enhanced/` - New 12 visemes
- `emotional/` - 9 emotional variants
- `contextual/` - 9 contextual variants

### **Metadata Files**
- `rig.json` - Updated with all 48 visemes
- `viseme_mapping.json` - Comprehensive phoneme-to-viseme mapping
- `viseme_expansion_report.json` - Pipeline execution summary

## 🎨 Advanced Features

### **Emotional Intelligence**
The system automatically detects emotional content:
```javascript
// Happy words trigger HAPPY variants
"Great! Amazing! Wonderful!" → A_HAPPY, E_HAPPY, I_HAPPY

// Serious words trigger SERIOUS variants  
"Important! Critical! Warning!" → A_SERIOUS, E_SERIOUS, I_SERIOUS

// Excited words trigger EXCITED variants
"Wow! Incredible! Fantastic!" → A_EXCITED, E_EXCITED, I_EXCITED
```

### **Context Awareness**
Teaching scenarios automatically use appropriate variants:
```javascript
// Questions use QUESTION variants
"What is this?" → A_QUESTION, E_QUESTION, I_QUESTION

// Emphasis uses EMPHASIS variants
"This is **important**!" → A_EMPHASIS, E_EMPHASIS, I_EMPHASIS

// Teaching uses TEACH variants
"Let me explain..." → A_TEACH, E_TEACH, I_TEACH
```

### **Smart Fallbacks**
When enhanced visemes aren't available:
1. Try enhanced variant first
2. Fall back to emotional variant
3. Fall back to contextual variant
4. Finally fall back to basic viseme

## 📊 Performance & Quality

### **Frame Quality**
- **Resolution**: 512x512 (enhanced from original)
- **Format**: PNG with transparency support
- **Enhancement**: AI-powered upscaling and detail enhancement
- **Consistency**: Standardized mouth regions and expressions

### **Loading Performance**
- **Preloading**: All 48 visemes preloaded for smooth playback
- **Caching**: Intelligent frame caching to minimize reloads
- **CDN Support**: Multiple CDN fallbacks for reliability
- **Local Fallbacks**: Graceful degradation to local assets

### **Memory Usage**
- **Efficient Storage**: Compressed PNG format
- **Smart Caching**: Only load visemes currently in use
- **Memory Management**: Automatic cleanup of unused frames

## 🧪 Testing & Validation

### **Test Scenarios**
1. **Basic Functionality**: Test all 48 visemes load correctly
2. **Emotional Detection**: Verify automatic emotion detection
3. **Context Switching**: Test different teaching scenarios
4. **Performance**: Monitor frame loading and playback smoothness
5. **Fallbacks**: Test graceful degradation when enhanced visemes unavailable

### **Quality Metrics**
- **Lip Sync Accuracy**: Viseme timing matches audio phonemes
- **Visual Quality**: Enhanced frames maintain professional appearance
- **Emotional Expression**: Variants convey appropriate emotions
- **Contextual Relevance**: Teaching variants enhance educational experience

## 🔮 Future Enhancements

### **Phase 2: AI-Generated Visemes**
- Train custom models for viseme generation
- Generate infinite emotional and contextual variations
- Real-time viseme synthesis based on speech content

### **Phase 3: Advanced Expressions**
- Add eyebrow and eye expression variants
- Include head movement and gesture variants
- Create personality-specific viseme sets

### **Phase 4: Real-time Adaptation**
- Dynamic viseme selection based on speech patterns
- Adaptive emotional responses to content
- Personalized viseme preferences per user

## 🐛 Troubleshooting

### **Common Issues**

#### **Training Videos Not Found**
```bash
# Check video paths
ls -la critical-foundations/*.mp4

# Update paths in pipeline if needed
python3 viseme-expansion-pipeline.py --base-path /custom/path
```

#### **OpenCV Installation Issues**
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install python3-opencv

# Or use conda
conda install opencv
```

#### **Memory Issues with Large Videos**
```bash
# Reduce frame sampling in pipeline
# Edit viseme-expansion-pipeline.py line ~120
sample_interval = max(1, total_frames // 100)  # Sample 100 frames instead of 50
```

#### **Viseme Frames Not Loading**
```bash
# Check generated output
ls -la production-deploy/assets/avatars/kelly/2d/visemes/

# Verify rig.json updates
cat production-deploy/assets/avatars/kelly/2d/rig.json | grep -A 50 "visemes"
```

### **Debug Mode**
```bash
# Enable verbose logging
export PYTHONPATH=.
python3 -u viseme-expansion-pipeline.py 2>&1 | tee viseme_expansion.log
```

## 📈 Monitoring & Analytics

### **Performance Metrics**
- **Frame Load Time**: Time to load each viseme category
- **Memory Usage**: RAM consumption during playback
- **Cache Hit Rate**: Efficiency of viseme frame caching
- **Fallback Usage**: Frequency of enhanced viseme fallbacks

### **Quality Metrics**
- **Viseme Accuracy**: Match between expected and actual visemes
- **Emotional Detection**: Accuracy of automatic emotion detection
- **Context Relevance**: Appropriateness of contextual variants
- **User Satisfaction**: Subjective quality ratings

## 🤝 Contributing

### **Development Workflow**
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/enhanced-visemes`
3. **Implement** changes with tests
4. **Test** thoroughly with different scenarios
5. **Submit** pull request with detailed description

### **Code Standards**
- **Python**: PEP 8 compliance, type hints, comprehensive docstrings
- **JavaScript**: ES6+ syntax, JSDoc comments, error handling
- **Testing**: Unit tests for all new functionality
- **Documentation**: Update README for all changes

## 📄 License

This project is part of the iLearn How platform. All rights reserved.

## 🙏 Acknowledgments

- **Training Data**: Kelly and Ken training videos
- **OpenCV**: Computer vision processing capabilities
- **Avatar System**: Existing avatar synchronization infrastructure
- **TTS Integration**: Text-to-speech phoneme timing system

---

**🎉 Congratulations!** You now have a state-of-the-art 48-viseme avatar system that provides incredibly natural and expressive mouth synchronization for your educational content.
