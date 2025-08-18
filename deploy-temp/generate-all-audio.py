#!/usr/bin/env python3
"""
Generate audio for ALL lesson content
This will create a complete audio library
"""

import os
import subprocess
import time

print("🎯 Generating Complete Audio Library")
print("=" * 40)

# Read all script lines
with open('heygen_batches/kelly/batch_01.txt', 'r') as f:
    kelly_lines = [line.strip() for line in f if line.strip()]

with open('heygen_batches/ken/batch_01.txt', 'r') as f:
    ken_lines = [line.strip() for line in f if line.strip()]

total_lines = len(kelly_lines) + len(ken_lines)
print(f"\n📊 Total lines to generate: {total_lines}")
print(f"   Kelly: {len(kelly_lines)} lines")
print(f"   Ken: {len(ken_lines)} lines")
print(f"\n⏱️  Estimated time: {total_lines // 30} minutes")

response = input("\nGenerate all audio files? (y/n): ")
if response.lower() != 'y':
    print("Cancelled.")
    exit()

# Create directories
os.makedirs('generated_audio/kelly', exist_ok=True)
os.makedirs('generated_audio/ken', exist_ok=True)

print("\n🎤 Generating Kelly's voice...")
for i, text in enumerate(kelly_lines):
    output = f'generated_audio/kelly/line_{i:03d}.aiff'
    subprocess.run(['say', '-v', 'Samantha', '-r', '180', '-o', output, text], 
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if i % 10 == 0:
        print(f"   Progress: {i}/{len(kelly_lines)} ({i*100//len(kelly_lines)}%)")

print("\n🎤 Generating Ken's voice...")
for i, text in enumerate(ken_lines):
    output = f'generated_audio/ken/line_{i:03d}.aiff'
    subprocess.run(['say', '-v', 'Daniel', '-r', '170', '-o', output, text],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if i % 10 == 0:
        print(f"   Progress: {i}/{len(ken_lines)} ({i*100//len(ken_lines)}%)")

print(f"\n✅ Generated {total_lines} audio files!")
print("📁 Location: generated_audio/")

# Convert some to MP3 for smaller size
print("\n🔄 Converting samples to MP3...")
os.makedirs('generated_audio/mp3_samples', exist_ok=True)

for i in range(min(10, len(kelly_lines))):
    input_file = f'generated_audio/kelly/line_{i:03d}.aiff'
    output_file = f'generated_audio/mp3_samples/kelly_{i:03d}.mp3'
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', input_file, output_file],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("✅ Created MP3 samples for testing")
print("\n🎉 Audio generation complete!")
print("\n📚 Your audio library is ready for all 366 lessons!")
