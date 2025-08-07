# LESSON SEQUENCE UPDATE PLAN

## CURRENT STATE ANALYSIS

### DNA Structure (Source of Truth)
- **3 Questions**: Each lesson has exactly 3 questions (question_1, question_2, question_3)
- **2 Answer Choices**: Each question has exactly 2 choices (option_a, option_b)
- **1-3 Daily Fortunes**: Variable fortune count based on lesson complexity
- **Lesson Flow**: opening → content → question_1 → question_2 → question_3 → fortune → complete

### Current UI Implementation Issues
- **Single Question**: Currently only shows 1 question
- **3 Answer Choices**: Shows 3 choices instead of 2
- **No Question Progression**: Doesn't advance through all 3 questions
- **No Fortune Integration**: Fortune system not properly connected to DNA
- **No Teaching Moments**: Missing teaching moment integration between questions

## COMPREHENSIVE UPDATE PLAN

### PHASE 1: QUESTION SEQUENCE SYSTEM

#### 1.1 Update LessonContentManager Structure
```javascript
class LessonContentManager {
    constructor() {
        this.currentLesson = null;
        this.currentPhase = 'opening';
        this.currentQuestionIndex = 0; // Track which question (0, 1, 2)
        this.lessonProgress = 0;
        this.userAnswers = [];
        this.totalQuestions = 3; // Always 3 questions
        this.answerChoicesPerQuestion = 2; // Always 2 choices
    }
}
```

#### 1.2 Question Progression Logic
```javascript
// Show specific question by index
showQuestionByIndex(questionIndex) {
    const questions = this.currentLesson?.core_lesson_structure || {};
    const questionKey = `question_${questionIndex + 1}`;
    const questionData = questions[questionKey];
    
    if (!questionData) {
        console.error(`Question ${questionIndex + 1} not found`);
        return;
    }
    
    // Get age-specific examples
    const currentAge = this.getCurrentAge();
    const examples = this.currentLesson?.example_selector_data?.[`question_${questionIndex + 1}_examples`]?.[currentAge];
    
    // Generate question text and choices
    const questionText = this.generateQuestionText(questionData, examples);
    const choices = this.generateChoices(questionData, examples);
    
    // Display question and choices
    this.displayQuestion(questionText, choices, questionIndex);
}
```

#### 1.3 Answer Choice Generation
```javascript
generateChoices(questionData, examples) {
    return [
        {
            text: examples?.option_a || questionData.choice_architecture?.option_a || 'Option A',
            isCorrect: false,
            teachingMoment: questionData.teaching_moments?.option_a_response
        },
        {
            text: examples?.option_b || questionData.choice_architecture?.option_b || 'Option B', 
            isCorrect: true,
            teachingMoment: questionData.teaching_moments?.option_b_response
        }
    ];
}
```

### PHASE 2: TIMING AND SEQUENCE PATTERNS

#### 2.1 3x2x2x1 Pattern (2 Choices)
```javascript
const timingPatterns = {
    2: {
        showDelays: [0, 300], // 3x2x2x1 pattern
        hideDelays: [0, 150],
        clickDelays: [0, 200],
        questionTransitions: [1000, 800, 600] // Time between questions
    }
};
```

#### 2.2 Question Transition Flow
```javascript
advanceToNextQuestion() {
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex < this.totalQuestions) {
        // Show next question with timing
        setTimeout(() => {
            this.showQuestionByIndex(this.currentQuestionIndex);
        }, this.timingPatterns[2].questionTransitions[this.currentQuestionIndex]);
    } else {
        // All questions complete, show fortune
        setTimeout(() => {
            this.showFortunePhase();
        }, 1000);
    }
}
```

### PHASE 3: FORTUNE SYSTEM INTEGRATION

#### 3.1 Fortune Generation from DNA
```javascript
generateFortuneFromDNA() {
    const fortuneElements = this.currentLesson?.daily_fortune_elements;
    const userAnswers = this.userAnswers;
    
    // Generate personalized fortune based on answers
    const fortune = this.buildPersonalizedFortune(fortuneElements, userAnswers);
    
    return fortune;
}
```

#### 3.2 Fortune Display Options
```javascript
showFortunePhase() {
    const fortune = this.generateFortuneFromDNA();
    
    // Option 1: Single fortune overlay
    this.showSingleFortune(fortune);
    
    // Option 2: Multiple fortune cards (1-3)
    this.showMultipleFortunes(fortune);
    
    // Option 3: Interactive fortune reveal
    this.showInteractiveFortune(fortune);
}
```

### PHASE 4: TEACHING MOMENT INTEGRATION

#### 4.1 Teaching Moment Display
```javascript
showTeachingMoment(selectedChoice) {
    const teachingText = selectedChoice.teachingMoment;
    
    // Show teaching moment overlay
    this.displayTeachingMoment(teachingText);
    
    // Auto-advance after teaching moment
    setTimeout(() => {
        this.advanceToNextQuestion();
    }, 3000);
}
```

#### 4.2 Teaching Moment Timing
```javascript
handleAnswerSelection(answerIndex) {
    const currentQuestion = this.getCurrentQuestionData();
    const selectedChoice = currentQuestion.choices[answerIndex];
    
    // Visual feedback
    this.animateAnswerSelection(answerIndex);
    
    // Show teaching moment
    setTimeout(() => {
        this.showTeachingMoment(selectedChoice);
    }, 500);
}
```

### PHASE 5: UI/UX ENHANCEMENTS

#### 5.1 Progress Tracking
```javascript
updateProgressForQuestion(questionIndex) {
    const baseProgress = 20; // Opening phase
    const questionProgress = (questionIndex + 1) * 20; // 20% per question
    const totalProgress = baseProgress + questionProgress;
    
    this.updateProgress(totalProgress);
}
```

#### 5.2 Question Navigation
```javascript
// Add question navigation indicators
showQuestionNavigation() {
    const navHTML = `
        <div class="question-nav">
            <span class="nav-dot ${this.currentQuestionIndex === 0 ? 'active' : ''}"></span>
            <span class="nav-dot ${this.currentQuestionIndex === 1 ? 'active' : ''}"></span>
            <span class="nav-dot ${this.currentQuestionIndex === 2 ? 'active' : ''}"></span>
        </div>
    `;
    
    document.getElementById('question-nav-container').innerHTML = navHTML;
}
```

### PHASE 6: DNA INTEGRATION RECONCILIATION

#### 6.1 DNA to UI Mapping
```javascript
mapDNAToUI() {
    // Map DNA structure to UI components
    const mapping = {
        'core_lesson_structure': 'question_content',
        'example_selector_data': 'age_specific_examples', 
        'daily_fortune_elements': 'fortune_generation',
        'tone_delivery_dna': 'voice_character',
        'language_translations': 'content_localization',
        'age_expressions': 'age_specific_content'
    };
    
    return mapping;
}
```

#### 6.2 UI Sophistication Handling
```javascript
// Handle UI features not in DNA
handleUISophistication() {
    // 1. Timing and animations (not in DNA)
    this.applyTimingPatterns();
    
    // 2. Visual feedback (not in DNA)
    this.applyVisualFeedback();
    
    // 3. Progress tracking (not in DNA)
    this.trackProgress();
    
    // 4. Overlay positioning (not in DNA)
    this.positionOverlays();
}
```

## IMPLEMENTATION PRIORITY

### IMMEDIATE (Phase 1-2)
1. Update LessonContentManager to handle 3 questions
2. Implement 2-choice answer system
3. Add question progression logic
4. Implement timing patterns

### SHORT TERM (Phase 3-4)
1. Integrate fortune system from DNA
2. Add teaching moment display
3. Enhance progress tracking
4. Add question navigation

### MEDIUM TERM (Phase 5-6)
1. Reconcile DNA structure with UI sophistication
2. Add advanced fortune options
3. Implement comprehensive error handling
4. Add lesson completion tracking

## SUCCESS CRITERIA

### Technical Requirements
- ✅ 3 questions per lesson (always)
- ✅ 2 answer choices per question (always)
- ✅ Proper question progression
- ✅ Teaching moments between questions
- ✅ Fortune generation from DNA
- ✅ Timing patterns (3x2x2x1)
- ✅ Progress tracking (0-100%)
- ✅ Error handling for missing DNA data

### User Experience Requirements
- ✅ Smooth transitions between questions
- ✅ Clear visual feedback for answers
- ✅ Engaging teaching moments
- ✅ Personalized fortune display
- ✅ Intuitive navigation
- ✅ Responsive design

### DNA Integration Requirements
- ✅ Full DNA structure utilization
- ✅ Age-specific content adaptation
- ✅ Tone and language switching
- ✅ Avatar mood integration
- ✅ Cultural adaptation
- ✅ Universal concept preservation

## NEXT STEPS

1. **Implement Phase 1**: Update LessonContentManager structure
2. **Test Question Progression**: Verify 3 questions flow correctly
3. **Implement Answer System**: Ensure 2 choices work properly
4. **Add Teaching Moments**: Integrate between-question feedback
5. **Connect Fortune System**: Link to DNA fortune elements
6. **Test Complete Flow**: End-to-end lesson sequence validation 