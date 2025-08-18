#!/usr/bin/env python3
"""
Quick Voice Test - Get Ken & Kelly speaking in 5 minutes
No complex setup required!
"""

import os
import subprocess
import json

print("🎤 Quick Ken & Kelly Voice Test")
print("=" * 40)

# Check if we can use system TTS
def test_system_tts():
    """Test if macOS 'say' command works"""
    try:
        # Test with Kelly-like voice
        print("\n🔊 Testing system TTS...")
        subprocess.run(['say', '-v', 'Samantha', 'Hello, I am Kelly'], check=True)
        print("✅ System TTS works!")
        return True
    except:
        print("❌ System TTS not available")
        return False

# Create immediate voice wrapper
def create_voice_wrapper():
    """Create a simple voice system that works now"""
    
    wrapper_code = '''#!/usr/bin/env python3
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
'''
    
    with open('speak.py', 'w') as f:
        f.write(wrapper_code)
    
    os.chmod('speak.py', 0o755)
    print("\n✅ Created speak.py - You can now generate voices!")
    print("\nTry it:")
    print("  python3 speak.py kelly 'Welcome to today\\'s lesson'")
    print("  python3 speak.py ken 'Let\\'s explore the sun'")

# Create batch converter for all lesson text
def create_batch_converter():
    """Convert text files to audio"""
    
    converter_code = '''#!/usr/bin/env python3
import os
import subprocess

# Read Kelly's script
with open('heygen_batches/kelly/batch_01.txt', 'r') as f:
    kelly_lines = [line.strip() for line in f if line.strip()]

# Read Ken's script  
with open('heygen_batches/ken/batch_01.txt', 'r') as f:
    ken_lines = [line.strip() for line in f if line.strip()]

print(f"Found {len(kelly_lines)} Kelly lines and {len(ken_lines)} Ken lines")

# Create output directory
os.makedirs('generated_audio/kelly', exist_ok=True)
os.makedirs('generated_audio/ken', exist_ok=True)

# Convert first 10 lines as a test
print("\\nGenerating first 10 audio files...")

for i, text in enumerate(kelly_lines[:10]):
    output = f'generated_audio/kelly/line_{i:03d}.aiff'
    subprocess.run(['say', '-v', 'Samantha', '-r', '180', '-o', output, text])
    print(f"✅ Kelly line {i+1}")

for i, text in enumerate(ken_lines[:10]):
    output = f'generated_audio/ken/line_{i:03d}.aiff'
    subprocess.run(['say', '-v', 'Daniel', '-r', '170', '-o', output, text])
    print(f"✅ Ken line {i+1}")

print("\\n✅ Generated 20 test audio files!")
print("Check: generated_audio/")
'''
    
    with open('batch_convert.py', 'w') as f:
        f.write(converter_code)
    
    os.chmod('batch_convert.py', 0o755)
    print("\n✅ Created batch_convert.py")

# Main execution
if __name__ == "__main__":
    # Test system TTS
    if test_system_tts():
        create_voice_wrapper()
        create_batch_converter()
        
        print("\n🎉 SUCCESS! You now have:")
        print("  1. speak.py - Generate any text as Ken/Kelly")
        print("  2. batch_convert.py - Convert lesson scripts to audio")
        print("\n📚 Next: Run 'python3 batch_convert.py' to generate audio files")
    else:
        print("\n⚠️  System TTS not working. Moving to Plan B...")
