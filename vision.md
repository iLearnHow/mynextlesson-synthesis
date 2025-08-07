# iLearn V2 Homepage Vision Document

## Executive Summary

The iLearn V2 homepage represents a fundamental redesign from overlay-based interactions to a structured grid layout that maximizes screen real estate and improves user experience. This document outlines the complete vision, technical requirements, and implementation strategy.

## Current State Analysis

### Existing Implementation (index.html - 2679 lines)
- **Architecture**: Overlay-based system with floating panels
- **Layout**: Full-screen background with Ken as wallpaper
- **Settings**: Right-side icon stack controlling overlays
- **Calendar**: Navigate to our lessons floating overlay month view on top of icon stack on the right side that links our 366 topics by day is a navigator to our pre-defined daily-lessons universal lesson topics
- **Media Controls**: Separate bottom-right floating horizontal bottom right panel to control lesson volume, speed, and progress, navigate through the 5 phases of a lesson which controls the full-screen background with Ken as wallpaper image and answer choices 
- **Lesson Content**: Contains one main floating left-middle-top overlay with text-on-screen prompts and floating overlay clickable floating answer choices in a row across lower third of screen which advance the lesson forward.
- **New Lesson**: a + icon that allows a user to generate a universal lesson on-demand (as opposed to viewing our 365 pre-generated daily-lessons)
- **Avatar Picker**: an icon that expands out to the right when clicked with three options in a row (kelly, ken, you)


## V2 Vision Overview

### Core Design Philosophy
**"Grid-First, Wallpaper-Centric, Intuitive Navigation"**

The V2 homepage transforms from an overlay-heavy interface to a structured grid system that provides immediate access to all functionality while maintaining visual hierarchy and professional aesthetics.

## Technical Architecture

```

### Component Specifications

#### 1. Calendar Month View
- **Position**: Top 1/3 of right panel on top of icon stack
- **Visibility**: Hidden by default, toggled by menu button
- **Functionality**: 
  - Full month calendar with month-to-month navigation for past 12 months and next 12 months
  - Auto-selects today's lesson
  - Click a day to load the corresponding pre-generated daily lessons load lesson content from topic list 
- **Technical Requirements**:
  - Grid layout with 7 columns (days of week)
  - Responsive day cells with hover states showing the universal topic of the day - if clicked opens that lesson
  - Month navigation with month names and year navigation buttons
  - Integration with curriculum data system - only the topics have been defined - we have not generated a full lesson that works fully in the lesson player yet

#### 2. Lesson Content Area
- **Position**: Left of Ken avatar (absolute positioning)
- **Visibility**: Hidden by default, appears when calendar day selected, or menu is selected,
- **Functionality**:
  - Displays lesson title and description
  - Shows lesson options (Start, Preview, Variants)
  - Integrates with complete lesson system
- **Technical Requirements**:
  - Glass morphism design with backdrop blur
  - Scrollable content area
  - Responsive sizing (max-width: 400px)
  - Z-index management for proper layering

#### 2a. Lesson Answer Choices Areas
 **Position**: On top of avatar's chest - lower bottom 1/3 of screen in a row of two options or three options (absolute positioning)
- **Visibility**: Hidden by default, appears in phase 2,3,4 in lesson sequence 
- **Functionality**:
  - Displays answer choice text for user to click on
  - Shows new wallpaper upon click and autoplays to the next lesson phase
  - Appears during a lesson, not before or after, it's inside a lesson

- **Technical Requirements**:
  - Glass morphism design with backdrop blur
  - Responsive sizing (max-width: 400px)
  - Z-index management for proper layering

#### 3. Ken Avatar
- **Position**: Full-screen wallpaper
- **Functionality**: 
  - Wallpaper switching based on phase and answer choice selection
  - Dynamic based on selected avatar (Ken/Kelly/You)

- **Technical Requirements**:
  - High-resolution image display
  - Integration with avatar selection system

#### 4. Control Icons Stack
- **Position**: Right side of screen
- **Icons**: Avatar, Age, Tone, Language
- **Functionality**: 
  - Expand on click with button options
  - Professional design with glass morphism
  - Auto-close after selection
- **Technical Requirements**:
  - Circular icons with hover effects
  - Horizontal row tray of buttons in line with it's icon opens and closes on click with button answe choices
  - Integration with variant system that links directly to the lesson dna file 

#### 5. Media Controls Panel
- **Position**: Bottom-right corner
- **Visibility**: Hidden by default, toggled by menu button or lesson play or calendar day selected
- **Functionality**:
  - Lesson phase progress bar
    - Volume, speed, mute controls
  - Play, next, autoplay buttons
- **Technical Requirements**:
  - Glass morphism design
  - Tight professional layout for controls
  - Progress bar with real-time updates on top
  - Integration with audio system and lesson phases

#### 6. Menu Button
- **Position**: Bottom-right corner (separate from media panel)
- **Functionality**: 
  - Toggles calendar and media controls and new lesson on-demand controls
  - Single point of control for main interfaces
- **Technical Requirements**:
  - Circular button with hamburger icon
  - Hover effects and animations
  - State management for open/closed

### 6. New Button
- **Position**: Bottom-right corner (separate and on top media panel, beside the first icon in the right stack with +) 
- **Functionality**: 
  - Allows user to enter a new lesson topic to be made on-demand with our lesson-dna generator 
  - Single point of control for new lesson creation
- **Technical Requirements**:
  - Circular button with + icon
  - Opens a search bar to type in a proposed new topic for universal lesson generation for a single variant or for all variants
  - State management for lesson creation state - will take at least 24 hours

## System Integration Requirements

### Existing Systems to Preserve
1. **Curriculum System** (`complete-curriculum.js`)
   - Monthly lesson data
   - Day-specific content generation
   - Topic selection and management

2. **Variant Generator** (`corrected-variant-generator-v2.js`)
   - Age-specific content adaptation
   - Tone variations (neutral, fun, grandparent)
   - Language support with native names
   - Avatar selection (Ken, Kelly, You)

3. **Lesson Player** (`complete-lesson-player.js`)
   - Lesson content generation
   - Interactive three question system - 5 phases a. welcome, b-d. question 1,2,3, e. daily fortune.
   - Complete lesson display for variant toggling real-time instant swtiching

4. **Audio Integration** 
- PiperTTS - Kelly and Ken Voices to be intergrated
- backup (`complete-elevenlabs-integration.js`)
   - Voice synthesis
   - Playback controls in media panel
   - Speed and volume management
   - Autoplay functionality

### Integration Points
- **Calendar → Lesson System**: Day selection triggers lesson loading
- **Variant Controls → Content Display**: Real-time content adaptation
- **Media Controls → Audio System**: Direct control integration
- **Progress → Lesson Player**: Real-time progress updates
- **New→ DNA file creation**: on-demand universal lesson generation or variant specific lesson generation


## User Experience Flow

### Initial State
1. **Clean Interface**:  Ken Wallpaper avatar and media control panel and menu icons visible
2. **Auto-Selection**: Today's lesson automatically selected and auto-plays after 15 seconds or upon play click in media panel

### Primary User Journey
1. **Menu Click**: Opens calendar and media controls
2. **Calendar Selection**: Choose lesson from month view, toggle month and see year
3. **Lesson Content**: Appears on left of avatar
4. **Variant Adjustment**: Use control icons (age, tone, language) to change lesson display text and auto and avatar wallpaper
5. **Media Control**: Adjust playback settings
6. **Lesson Interaction**: Start, Answer 3 questions, 3 teaching moments, 1-3 daily fortune options - phases 1-5 of a lesson. 

### Secondary Interactions
- **Variant Changes**: Real-time content adaptation
- **Avatar Switching**: Dynamic avatar wallpaper display
- **Progress Tracking**: Integrated progress monitoring

## Success Metrics

### Technical Metrics
- **Performance**: < 2s initial load time
- **Responsiveness**: < 100ms interaction response
- **Reliability**: 99.9% uptime for core functionality
- **Compatibility**: Support for Chrome, Safari, Firefox, Edge

### User Experience Metrics
- **Task Completion**: 95% success rate for all five lesson phases 
- **Time to First Lesson**: < 30 seconds from page load
- **Error Rate**: < 5% for variant changes
- **User Satisfaction**: > 4.5/5 rating

## Risk Assessment

### High Risk
- **System Integration**: Complex integration of 4 major systems
- **Performance**: Multiple systems running simultaneously

### Medium Risk
- **Browser Compatibility**: Advanced CSS features
- **Mobile Responsiveness**: Grid layout on smaller screens
- **Audio Integration**: Real-time audio processing

### Mitigation Strategies
- **Incremental Development**: Phase-based implementation
- **Extensive Testing**: Automated and manual testing
- **Fallback Options**: Graceful degradation for failures
- **User Training**: Documentation and tutorials

## Resource Requirements

### Development Team
- **Senior Frontend Engineer**: Layout and interaction development
- **JavaScript Specialist**: System integration and optimization
- **UX Designer**: Interface refinement and user testing
- **QA Engineer**: Comprehensive testing and validation

### Technical Resources
- **Development Environment**: Modern browser testing suite
- **Performance Tools**: Lighthouse, WebPageTest
- **Audio Equipment**: Testing for voice synthesis
- **Device Testing**: Multiple screen sizes and devices

## Conclusion

The iLearn V2 homepage represents a significant evolution from the current overlay-based system to a structured, grid-based interface that maximizes usability and provides a more intuitive learning experience. The implementation strategy prioritizes system preservation while delivering the enhanced user experience through careful integration and comprehensive testing.

This vision document serves as the foundation for development, ensuring all stakeholders have a complete understanding of the technical requirements, user experience goals, and implementation approach. 