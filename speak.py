#!/usr/bin/env python3
import subprocess
import sys

def speak_as_kelly(text):
    """Speak text using Kelly-like voice"""
    subprocess.run(['say', '-v', 'Samantha', '-r', '180', text])

def speak_as_ken(text):
    """Speak text using Ken-like voice"""  
    subprocess.run(['say', '-v', 'Daniel', '-r', '170', text])

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 speak.py [ken|kelly] 'Your text here'")
        sys.exit(1)
    
    voice = sys.argv[1].lower()
    text = sys.argv[2]
    
    if voice == "kelly":
        speak_as_kelly(text)
    else:
        speak_as_ken(text)
