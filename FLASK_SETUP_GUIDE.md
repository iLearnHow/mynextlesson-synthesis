# 🐍 Flask Backend Setup Guide

## Overview

The Flask backend provides user authentication, progress tracking, and habit formation for the iLearnHow Universal Lesson Player. It integrates seamlessly with the existing frontend interface.

## Quick Start

### 1. Install Dependencies
```bash
pip3 install Flask Flask-CORS Werkzeug python-dotenv
```

### 2. Set Up Environment
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Initialize Database
```bash
python3 database.py --seed
```

### 4. Start Flask Backend
```bash
python3 app.py
```

### 5. Test Backend
```bash
python3 test_flask.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check authentication status

### Lesson Progress
- `GET /api/lessons/progress` - Get user's lesson progress
- `POST /api/lessons/progress` - Update lesson progress
- `GET /api/lessons/{day}` - Get lesson data for specific day

### Habit Formation
- `GET /api/habits/status` - Get user's habit formation status

### User Preferences
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update user preferences

### Health Check
- `GET /api/health` - Backend health status

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    preferences TEXT DEFAULT '{}'
);
```

### Lesson Progress Table
```sql
CREATE TABLE lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_day INTEGER NOT NULL,
    phase INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    answers TEXT DEFAULT '[]',
    time_spent INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, lesson_day, phase)
);
```

### Habit Formation Table
```sql
CREATE TABLE habit_formation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    current_streak_start DATE,
    last_activity_date DATE,
    daily_goal_met BOOLEAN DEFAULT FALSE,
    weekly_goal_met BOOLEAN DEFAULT FALSE,
    monthly_goal_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Frontend Integration

The Flask backend integrates with the existing frontend through `flask-integration.js`:

### Features
- **Automatic Authentication Check**: Checks user login status on page load
- **Progress Tracking**: Saves lesson progress to database
- **Habit Formation**: Tracks daily streaks and learning habits
- **User Preferences**: Stores user settings (age, tone, language, avatar)
- **Seamless UI**: Login modal and user info display

### Usage
```javascript
// Check if user is authenticated
if (window.flaskIntegration.isAuthenticated) {
    // User is logged in
    console.log('User:', window.flaskIntegration.currentUser.username);
}

// Update lesson progress
await window.flaskIntegration.updateLessonProgress(1, 2, true, ['A'], 120);

// Get habit status
const habitStatus = await window.flaskIntegration.getHabitStatus();
console.log('Streak days:', habitStatus.streak_days);
```

## 5-Phase Lesson System Integration

The Flask backend is designed to work with the 5-phase lesson system:

### Phase Tracking
```javascript
// Phase 1: Welcome
await flaskIntegration.updateLessonProgress(day, 1, true, [], 60);

// Phase 2: Question 1
await flaskIntegration.updateLessonProgress(day, 2, true, ['A'], 90);

// Phase 3: Question 2
await flaskIntegration.updateLessonProgress(day, 3, true, ['B'], 90);

// Phase 4: Question 3
await flaskIntegration.updateLessonProgress(day, 4, true, ['A'], 90);

// Phase 5: Daily Fortune
await flaskIntegration.updateLessonProgress(day, 5, true, [], 30);
```

### Multiple Choice Integration
The system stores user answers for each phase:
```javascript
// Store answers for question phases
const answers = ['A', 'B', 'A']; // User's choices
await flaskIntegration.updateLessonProgress(day, 2, true, answers, 270);
```

## Production Deployment

### Environment Variables
```bash
# Production settings
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-super-secret-production-key
SESSION_COOKIE_SECURE=True
DATABASE_URL=sqlite:///ilearnhow_production.db
```

### Gunicorn Deployment
```bash
pip3 install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### Automated Testing
```bash
python3 test_flask.py
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   python3 database.py --seed
   ```

2. **Flask Not Starting**
   ```bash
   pip3 install Flask Flask-CORS Werkzeug python-dotenv
   python3 app.py
   ```

3. **CORS Issues**
   - Ensure Flask-CORS is installed
   - Check CORS configuration in `app.py`

4. **Authentication Issues**
   - Check session configuration
   - Verify credentials are being sent correctly

### Logs
```bash
# View Flask logs
tail -f flask.log

# Check database
sqlite3 ilearnhow.db ".tables"
```

## Security Considerations

1. **Password Hashing**: Uses Werkzeug's secure password hashing
2. **Session Management**: Secure session configuration
3. **CORS**: Properly configured for frontend integration
4. **Input Validation**: All inputs are validated and sanitized

## Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried columns
2. **Connection Pooling**: Use connection pooling for production
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Load Balancing**: Use multiple workers with Gunicorn

## Next Steps

1. **Implement 5-Phase Logic**: Connect Flask backend to lesson progression
2. **Add Real-time Updates**: WebSocket integration for live progress updates
3. **Enhance Analytics**: Add detailed learning analytics
4. **Scale for Production**: Optimize for 10,000+ concurrent users 