# 📊 VARIANT CALCULATION LOGIC
## iLearn.how System - July 29, 2025

### 🎯 **OVERVIEW**

The system generates lesson variants based on different combinations of parameters. Each variant represents a unique way to present the same lesson content.

### 📋 **PARAMETER DEFINITIONS**

#### **Age Groups (3 options)**
- `early_childhood` (3-8 years)
- `youth` (9-15 years) 
- `young_adult` (16-25 years)

#### **Tones (3 options)**
- `grandmother` (Warm & Nurturing)
- `fun` (Exciting & Playful)
- `neutral` (Balanced & Clear)

#### **Content Types (3 options)**
- `voice_over_script` (Spoken explanation)
- `on_screen_text` (Visual text display)
- `lesson_logic` (Structured learning approach)

#### **Question Types (3 options)**
- `question_1` (First question)
- `question_2` (Second question)
- `question_3` (Third question)

### 🧮 **3x3x3 FORMAT CALCULATION**

#### **Formula: Age Groups × Content Types × Question Types × Tones**

```javascript
const ageGroups = ['early_childhood', 'youth', 'young_adult'];           // 3 options
const contentTypes = ['voice_over_script', 'on_screen_text', 'lesson_logic']; // 3 options
const questionTypes = ['question_1', 'question_2', 'question_3'];        // 3 options
const tones = ['grandmother', 'fun', 'neutral'];                         // 3 options

// Total variants = 3 × 3 × 3 × 3 = 81
```

#### **Detailed Breakdown:**

| Age Group | Content Type | Question Type | Tone | Total |
|-----------|--------------|---------------|------|-------|
| early_childhood | voice_over_script | question_1 | grandmother | 1 |
| early_childhood | voice_over_script | question_1 | fun | 1 |
| early_childhood | voice_over_script | question_1 | neutral | 1 |
| early_childhood | voice_over_script | question_2 | grandmother | 1 |
| early_childhood | voice_over_script | question_2 | fun | 1 |
| early_childhood | voice_over_script | question_2 | neutral | 1 |
| early_childhood | voice_over_script | question_3 | grandmother | 1 |
| early_childhood | voice_over_script | question_3 | fun | 1 |
| early_childhood | voice_over_script | question_3 | neutral | 1 |
| **... (continues for all combinations)** | | | | **81 total** |

#### **Code Implementation:**
```javascript
// Generate 3x3x3 format variants (81 combinations)
for (const ageGroup of ageGroups) {           // 3 iterations
    for (const tone of tones) {               // 3 iterations
        for (const contentType of contentTypes) { // 3 iterations
            for (const questionType of questionTypes) { // 3 iterations
                variants.push({
                    ageGroup,
                    tone,
                    contentType,
                    questionType,
                    choice: 'A',
                    content: generateContent(ageGroup, tone, contentType, questionType),
                    variantId: `${ageGroup}_${tone}_${contentType}_${questionType}_A`
                });
            }
        }
    }
}
// Total: 3 × 3 × 3 × 3 = 81 variants
```

### 📈 **3x2x1 FORMAT CALCULATION**

#### **Formula: Age Groups × Content Types × Question Types × Tones**

```javascript
const ageGroups = ['early_childhood', 'youth', 'young_adult'];           // 3 options
const contentTypes = ['voice_over_script', 'on_screen_text'];            // 2 options (reduced)
const questionTypes = ['question_1'];                                     // 1 option (reduced)
const tones = ['grandmother', 'fun', 'neutral'];                         // 3 options

// Total variants = 3 × 2 × 1 × 3 = 18
```

#### **Detailed Breakdown:**

| Age Group | Content Type | Question Type | Tone | Total |
|-----------|--------------|---------------|------|-------|
| early_childhood | voice_over_script | question_1 | grandmother | 1 |
| early_childhood | voice_over_script | question_1 | fun | 1 |
| early_childhood | voice_over_script | question_1 | neutral | 1 |
| early_childhood | on_screen_text | question_1 | grandmother | 1 |
| early_childhood | on_screen_text | question_1 | fun | 1 |
| early_childhood | on_screen_text | question_1 | neutral | 1 |
| youth | voice_over_script | question_1 | grandmother | 1 |
| youth | voice_over_script | question_1 | fun | 1 |
| youth | voice_over_script | question_1 | neutral | 1 |
| youth | on_screen_text | question_1 | grandmother | 1 |
| youth | on_screen_text | question_1 | fun | 1 |
| youth | on_screen_text | question_1 | neutral | 1 |
| young_adult | voice_over_script | question_1 | grandmother | 1 |
| young_adult | voice_over_script | question_1 | fun | 1 |
| young_adult | voice_over_script | question_1 | neutral | 1 |
| young_adult | on_screen_text | question_1 | grandmother | 1 |
| young_adult | on_screen_text | question_1 | fun | 1 |
| young_adult | on_screen_text | question_1 | neutral | 1 |
| **Total** | | | | **18** |

#### **Code Implementation:**
```javascript
// Generate 3x2x1 format variants (18 combinations)
const ageGroups = ['early_childhood', 'youth', 'young_adult'];           // 3 options
const contentTypes = ['voice_over_script', 'on_screen_text'];            // 2 options
const questionTypes = ['question_1'];                                     // 1 option
const tones = ['grandmother', 'fun', 'neutral'];                         // 3 options

for (const ageGroup of ageGroups) {           // 3 iterations
    for (const tone of tones) {               // 3 iterations
        for (const contentType of contentTypes) { // 2 iterations
            for (const questionType of questionTypes) { // 1 iteration
                variants.push({
                    ageGroup,
                    tone,
                    contentType,
                    questionType,
                    choice: 'A',
                    content: generateContent(ageGroup, tone, contentType, questionType),
                    variantId: `${ageGroup}_${tone}_${contentType}_${questionType}_A`
                });
            }
        }
    }
}
// Total: 3 × 2 × 1 × 3 = 18 variants
```

### 🔍 **FILTERING LOGIC**

#### **3x3x3 Filter:**
```javascript
get3x3x3Variants() {
    const ageGroups = ['early_childhood', 'youth', 'young_adult'];
    const contentTypes = ['voice_over_script', 'on_screen_text', 'lesson_logic'];
    const questionTypes = ['question_1', 'question_2', 'question_3'];
    
    return allVariants.filter(variant => 
        ageGroups.includes(variant.ageGroup) &&
        contentTypes.includes(variant.contentType) &&
        questionTypes.includes(variant.questionType)
    );
}
// Result: 81 variants (3×3×3×3)
```

#### **3x2x1 Filter:**
```javascript
get3x2x1Variants() {
    const ageGroups = ['early_childhood', 'youth', 'young_adult'];
    const contentTypes = ['voice_over_script', 'on_screen_text'];        // Reduced to 2
    const questionTypes = ['question_1'];                                 // Reduced to 1
    
    return allVariants.filter(variant => 
        ageGroups.includes(variant.ageGroup) &&
        contentTypes.includes(variant.contentType) &&
        questionTypes.includes(variant.questionType)
    );
}
// Result: 18 variants (3×2×1×3)
```

### 📊 **COMPARISON TABLE**

| Format | Age Groups | Content Types | Question Types | Tones | Total Variants | Formula |
|--------|------------|---------------|----------------|-------|----------------|---------|
| 3x3x3 | 3 | 3 | 3 | 3 | 81 | 3×3×3×3 |
| 3x2x1 | 3 | 2 | 1 | 3 | 18 | 3×2×1×3 |

### 🎯 **VARIANT EXAMPLES**

#### **3x3x3 Example Variants:**
1. `early_childhood_grandmother_voice_over_script_question_1_A`
2. `early_childhood_fun_voice_over_script_question_1_A`
3. `early_childhood_neutral_voice_over_script_question_1_A`
4. `early_childhood_grandmother_voice_over_script_question_2_A`
5. `early_childhood_fun_voice_over_script_question_2_A`
6. `early_childhood_neutral_voice_over_script_question_2_A`
7. `early_childhood_grandmother_voice_over_script_question_3_A`
8. `early_childhood_fun_voice_over_script_question_3_A`
9. `early_childhood_neutral_voice_over_script_question_3_A`
10. `early_childhood_grandmother_on_screen_text_question_1_A`
... (continues for all 81 combinations)

#### **3x2x1 Example Variants:**
1. `early_childhood_grandmother_voice_over_script_question_1_A`
2. `early_childhood_fun_voice_over_script_question_1_A`
3. `early_childhood_neutral_voice_over_script_question_1_A`
4. `early_childhood_grandmother_on_screen_text_question_1_A`
5. `early_childhood_fun_on_screen_text_question_1_A`
6. `early_childhood_neutral_on_screen_text_question_1_A`
7. `youth_grandmother_voice_over_script_question_1_A`
8. `youth_fun_voice_over_script_question_1_A`
9. `youth_neutral_voice_over_script_question_1_A`
10. `youth_grandmother_on_screen_text_question_1_A`
... (continues for all 18 combinations)

### ✅ **VERIFICATION**

The calculation logic has been verified through:
- ✅ Unit tests in `test-july-29-generation.js`
- ✅ Quality validation tests in `quality-validation-test.js`
- ✅ Manual verification of variant counts
- ✅ Confirmation that all combinations are unique

**Result: 81 variants for 3x3x3 format, 18 variants for 3x2x1 format** ✅ 