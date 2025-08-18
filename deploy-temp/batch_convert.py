#!/usr/bin/env python3
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
print("\nGenerating first 10 audio files...")

for i, text in enumerate(kelly_lines[:10]):
    output = f'generated_audio/kelly/line_{i:03d}.aiff'
    subprocess.run(['say', '-v', 'Samantha', '-r', '180', '-o', output, text])
    print(f"✅ Kelly line {i+1}")

for i, text in enumerate(ken_lines[:10]):
    output = f'generated_audio/ken/line_{i:03d}.aiff'
    subprocess.run(['say', '-v', 'Daniel', '-r', '170', '-o', output, text])
    print(f"✅ Ken line {i+1}")

print("\n✅ Generated 20 test audio files!")
print("Check: generated_audio/")
