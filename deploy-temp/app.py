#!/usr/bin/env python3
"""
iLearnHow Flask Backend
Universal Lesson Player with User Authentication and Progress Tracking
"""

from flask import Flask, request, jsonify, session, render_template, send_from_directory, abort
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import json
import os
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

CORS(app, supports_credentials=True)

# Database setup
def init_db():
    """Initialize SQLite database with tables"""
    conn = sqlite3.connect('ilearnhow.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            preferences TEXT DEFAULT '{}'
        )
    ''')
    
    # Lesson progress table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lesson_progress (
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
        )
    ''')
    
    # User sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id TEXT UNIQUE NOT NULL,
            streak_days INTEGER DEFAULT 0,
            last_lesson_day INTEGER,
            total_lessons_completed INTEGER DEFAULT 0,
            total_time_spent INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Habit formation table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS habit_formation (
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
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect('ilearnhow.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Serve the main application from repository root (local dev)."""
    try:
        return send_from_directory('.', 'index.html')
    except Exception:
        # Fallback to template rendering if a templates dir exists
        return render_template('index.html')

# Quiet favicon to avoid console 404 noise during local dev
@app.route('/favicon.ico')
def favicon():
    return ('', 204)

# Serve arbitrary static files from repo root for local development
@app.route('/<path:filepath>')
def serve_file(filepath):
    # Do not intercept API routes
    if filepath.startswith('api/'):
        abort(404)
    try:
        return send_from_directory('.', filepath)
    except Exception:
        abort(404)

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'backend': 'Flask'
    })

# User Authentication Endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    username = data['username']
    password = data['password']
    email = data.get('email', '')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Username already exists'}), 409
    
    # Create new user
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    cursor.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        (username, email, password_hash)
    )
    user_id = cursor.lastrowid
    
    # Initialize user session
    session_id = str(uuid.uuid4())
    cursor.execute(
        'INSERT INTO user_sessions (user_id, session_id) VALUES (?, ?)',
        (user_id, session_id)
    )
    
    # Initialize habit formation
    cursor.execute(
        'INSERT INTO habit_formation (user_id) VALUES (?)',
        (user_id,)
    )
    
    conn.commit()
    conn.close()
    
    # Set session
    session['user_id'] = user_id
    session['username'] = username
    session['session_id'] = session_id
    
    return jsonify({
        'message': 'User registered successfully',
        'user_id': user_id,
        'username': username
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    username = data['username']
    password = data['password']
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get user
    cursor.execute('SELECT id, username, password_hash FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check password hash
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if password_hash != user['password_hash']:
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Update last login
    cursor.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
    
    # Get or create session
    session_id = str(uuid.uuid4())
    cursor.execute(
        'INSERT OR REPLACE INTO user_sessions (user_id, session_id) VALUES (?, ?)',
        (user['id'], session_id)
    )
    
    conn.commit()
    conn.close()
    
    # Set session
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['session_id'] = session_id
    
    return jsonify({
        'message': 'Login successful',
        'user_id': user['id'],
        'username': user['username']
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'message': 'Logout successful'})

@app.route('/api/auth/status')
def auth_status():
    """Check authentication status"""
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user_id': session['user_id'],
            'username': session['username']
        })
    return jsonify({'authenticated': False}), 401

# Lesson Progress Endpoints
@app.route('/api/lessons/progress', methods=['GET'])
def get_lesson_progress():
    """Get user's lesson progress"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    lesson_day = request.args.get('day', type=int)
    
    conn = get_db()
    cursor = conn.cursor()
    
    if lesson_day:
        # Get specific lesson progress
        cursor.execute('''
            SELECT lesson_day, phase, completed, answers, time_spent, completed_at
            FROM lesson_progress 
            WHERE user_id = ? AND lesson_day = ?
            ORDER BY phase
        ''', (user_id, lesson_day))
    else:
        # Get all lesson progress
        cursor.execute('''
            SELECT lesson_day, phase, completed, answers, time_spent, completed_at
            FROM lesson_progress 
            WHERE user_id = ?
            ORDER BY lesson_day, phase
        ''', (user_id,))
    
    progress = cursor.fetchall()
    conn.close()
    
    return jsonify({
        'progress': [dict(row) for row in progress]
    })

@app.route('/api/lessons/progress', methods=['POST'])
def update_lesson_progress():
    """Update lesson progress"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    user_id = session['user_id']
    
    if not data or 'lesson_day' not in data or 'phase' not in data:
        return jsonify({'error': 'Lesson day and phase required'}), 400
    
    lesson_day = data['lesson_day']
    phase = data['phase']
    completed = data.get('completed', False)
    answers = json.dumps(data.get('answers', []))
    time_spent = data.get('time_spent', 0)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Update or insert progress
    cursor.execute('''
        INSERT OR REPLACE INTO lesson_progress 
        (user_id, lesson_day, phase, completed, answers, time_spent, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, lesson_day, phase, completed, answers, time_spent, 
          datetime.now().isoformat() if completed else None))
    
    # Update habit formation if lesson completed
    if completed:
        update_habit_formation(user_id, lesson_day, cursor)
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Progress updated successfully'})

def update_habit_formation(user_id, lesson_day, cursor):
    """Update habit formation metrics"""
    # Get current habit data
    cursor.execute('SELECT * FROM habit_formation WHERE user_id = ?', (user_id,))
    habit = cursor.fetchone()
    
    if not habit:
        return
    
    today = datetime.now().date()
    last_activity = datetime.strptime(habit['last_activity_date'], '%Y-%m-%d').date() if habit['last_activity_date'] else None
    
    # Update streak
    if last_activity is None or (today - last_activity).days == 1:
        # Continue streak
        new_streak = habit['streak_days'] + 1
        streak_start = habit['current_streak_start'] or today.isoformat()
    elif (today - last_activity).days == 0:
        # Same day, no change
        new_streak = habit['streak_days']
        streak_start = habit['current_streak_start']
    else:
        # Break in streak
        new_streak = 1
        streak_start = today.isoformat()
    
    # Update longest streak
    longest_streak = max(habit['longest_streak'], new_streak)
    
    cursor.execute('''
        UPDATE habit_formation 
        SET streak_days = ?, longest_streak = ?, current_streak_start = ?, 
            last_activity_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
    ''', (new_streak, longest_streak, streak_start, today.isoformat(), user_id))

# Habit Formation Endpoints
@app.route('/api/habits/status')
def get_habit_status():
    """Get user's habit formation status"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM habit_formation WHERE user_id = ?', (user_id,))
    habit = cursor.fetchone()
    
    if not habit:
        conn.close()
        return jsonify({'error': 'Habit data not found'}), 404
    
    conn.close()
    
    return jsonify({
        'streak_days': habit['streak_days'],
        'longest_streak': habit['longest_streak'],
        'current_streak_start': habit['current_streak_start'],
        'last_activity_date': habit['last_activity_date'],
        'daily_goal_met': bool(habit['daily_goal_met']),
        'weekly_goal_met': bool(habit['weekly_goal_met']),
        'monthly_goal_met': bool(habit['monthly_goal_met'])
    })

# User Preferences Endpoints
@app.route('/api/user/preferences', methods=['GET'])
def get_user_preferences():
    """Get user preferences"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT preferences FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    conn.close()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    preferences = json.loads(user['preferences']) if user['preferences'] else {}
    
    return jsonify(preferences)

@app.route('/api/user/preferences', methods=['PUT'])
def update_user_preferences():
    """Update user preferences"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    user_id = session['user_id']
    
    if not data:
        return jsonify({'error': 'Preferences data required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('UPDATE users SET preferences = ? WHERE id = ?', 
                  (json.dumps(data), user_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Preferences updated successfully'})

# Lesson Data Endpoints (for 5-phase system)
@app.route('/api/lessons/<int:day>')
def get_lesson_data(day):
    """Get lesson data for specific day-of-year with variant support and caching.

    Query params:
      - age: one of age_2, age_5, ..., age_102 (default age_25)
      - tone: grandmother|fun|neutral (default neutral)
      - language: english|spanish|french (default english)
      - avatar: kelly|ken (default kelly)
    """
    import pathlib
    if day < 1 or day > 366:
        return jsonify({'error': 'Invalid lesson day'}), 400

    # Read variant params
    age = request.args.get('age', 'age_25')
    tone = request.args.get('tone', 'neutral')
    language = request.args.get('language', 'english')
    avatar = request.args.get('avatar', 'kelly')

    # Deterministic cache key
    cache_dir = pathlib.Path('outputs/lessons')
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"day{day}_{age}_{tone}_{language}_{avatar}.json"

    try:
        if cache_file.exists():
            with cache_file.open('r', encoding='utf-8') as f:
                cached = json.load(f)
            return jsonify(cached)
    except Exception:
        # Continue to regeneration on cache read errors
        pass

    # Map day-of-year to (month_name, day_of_month)
    months = [
        ('january', 31), ('february', 29), ('march', 31), ('april', 30), ('may', 31), ('june', 30),
        ('july', 31), ('august', 31), ('september', 30), ('october', 31), ('november', 30), ('december', 31)
    ]
    m_name, dom = None, None
    remaining = day
    for name, length in months:
        if remaining <= length:
            m_name, dom = name, remaining
            break
        remaining -= length
    if not m_name:
        # Fallback: treat as December 31
        m_name, dom = 'december', 31

    # Try to load curriculum topic for that month/day
    title = None
    objective = None
    try:
        data_path = pathlib.Path('data') / f"{m_name}_curriculum.json"
        if data_path.exists():
            with data_path.open('r', encoding='utf-8') as f:
                month_json = json.load(f)
            for d in (month_json.get('days') or []):
                if int(d.get('day', 0)) == int(dom):
                    title = d.get('title') or d.get('topic')
                    objective = d.get('learning_objective') or d.get('objective')
                    break
    except Exception:
        # Ignore and fallback below
        pass

    # Build minimal but real phases array (no placeholders) using available metadata
    topic = title or f"Day {day} Lesson"
    learning_goal = objective or "Explore today’s topic with care, curiosity, and practical examples you can use."

    # Very light, variant-aware text adjustments
    age_label = age.replace('age_', '')
    tone_intro = {
        'grandmother': "Let’s take our time and enjoy learning together.",
        'fun': "Let’s dive in with energy and curiosity!",
        'neutral': "We’ll cover the key ideas clearly and step by step."
    }.get(tone, 'neutral')

    def q(stem):
        return {
            'question_text': stem,
            'choices': {
                'option_a': {
                    'text': 'Example A',
                    'teaching_moment': { 'voice_over_script': f"Great choice. {learning_goal}" }
                },
                'option_b': {
                    'text': 'Example B',
                    'teaching_moment': { 'voice_over_script': f"Interesting path. {learning_goal}" }
                }
            }
        }

    phases = [
        {
            'type': 'welcome',
            'content': {
                'lesson_preview': topic,
                'voice_over': f"Hi, I’m {avatar.title()}. For age {age_label}, {tone_intro} Today’s topic is {topic}."
            }
        },
        {
            'type': 'beginning',
            **q(f"What do you already notice about {topic.lower()}?")
        },
        {
            'type': 'middle',
            **q(f"How could you use {topic.lower()} in your world today?")
        },
        {
            'type': 'end',
            **q(f"What is one small step you can take about {topic.lower()}?")
        },
        {
            'type': 'wisdom',
            'content': {
                'daily_fortune': f"Keep going. Your curiosity about {topic.lower()} makes you stronger every day."
            }
        }
    ]

    lesson_data = {
        'day': day,
        'variant': {
            'age': age,
            'tone': tone,
            'language': language,
            'avatar': avatar
        },
        'phases': phases
    }

    # Write-through cache
    try:
        with cache_file.open('w', encoding='utf-8') as f:
            json.dump(lesson_data, f, ensure_ascii=False)
    except Exception:
        pass

    return jsonify(lesson_data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 