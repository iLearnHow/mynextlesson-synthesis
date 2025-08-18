#!/usr/bin/env python3
"""
Generate Emotional and Contextual Viseme Variants
Creates the missing emotional and contextual variants from base visemes
"""

import cv2
import numpy as np
import os
from pathlib import Path

def generate_emotional_variants(base_frame, emotion):
    """Generate emotional variants of base viseme frames"""
    try:
        if emotion == 'HAPPY':
            # Brighten and add warmth
            frame = cv2.convertScaleAbs(base_frame, alpha=1.1, beta=10)
        elif emotion == 'SERIOUS':
            # Darken slightly
            frame = cv2.convertScaleAbs(base_frame, alpha=0.9, beta=-5)
        elif emotion == 'EXCITED':
            # Increase saturation
            hsv = cv2.cvtColor(base_frame, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = cv2.multiply(hsv[:, :, 1], 1.2)
            frame = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        else:
            frame = base_frame.copy()
            
        return frame
        
    except Exception as e:
        print(f"Error generating emotional variant {emotion}: {e}")
        return base_frame

def generate_contextual_variants(base_frame, context):
    """Generate contextual variants for teaching scenarios"""
    try:
        if context == 'TEACH':
            # Slightly more pronounced mouth shape
            frame = cv2.convertScaleAbs(base_frame, alpha=1.05, beta=0)
        elif context == 'QUESTION':
            # Slightly raised eyebrows effect (simulated)
            frame = cv2.convertScaleAbs(base_frame, alpha=1.0, beta=5)
        elif context == 'EMPHASIS':
            # Enhanced contrast for emphasis
            frame = cv2.convertScaleAbs(base_frame, alpha=1.1, beta=0)
        else:
            frame = base_frame.copy()
            
        return frame
        
    except Exception as e:
        print(f"Error generating contextual variant {context}: {e}")
        return base_frame

def main():
    base_path = Path("production-deploy/assets/avatars")
    
    for speaker in ['kelly', 'ken']:
        print(f"Generating variants for {speaker}...")
        
        # Get base visemes (A, E, I)
        base_visemes = ['A', 'E', 'I']
        base_frames = {}
        
        # Try to load base visemes from existing files
        for viseme in base_visemes:
            # Try multiple sources
            possible_paths = [
                base_path / speaker / "2d" / f"mouth_{viseme}.png",
                base_path / speaker / "2d" / "visemes" / "enhanced" / f"mouth_{viseme}.png"
            ]
            
            for path in possible_paths:
                if path.exists():
                    base_frames[viseme] = cv2.imread(str(path))
                    print(f"Loaded base frame for {viseme} from {path}")
                    break
        
        if not base_frames:
            print(f"No base frames found for {speaker}, skipping...")
            continue
        
        # Generate emotional variants
        emotions = ['HAPPY', 'SERIOUS', 'EXCITED']
        for viseme in base_visemes:
            if viseme in base_frames:
                base_frame = base_frames[viseme]
                for emotion in emotions:
                    emotional_frame = generate_emotional_variants(base_frame, emotion)
                    output_path = base_path / speaker / "2d" / "visemes" / "emotional" / f"mouth_{viseme}_{emotion}.png"
                    cv2.imwrite(str(output_path), emotional_frame)
                    print(f"Generated emotional variant: {output_path}")
        
        # Generate contextual variants
        contexts = ['TEACH', 'QUESTION', 'EMPHASIS']
        for viseme in base_visemes:
            if viseme in base_frames:
                base_frame = base_frames[viseme]
                for context in contexts:
                    contextual_frame = generate_contextual_variants(base_frame, context)
                    output_path = base_path / speaker / "2d" / "visemes" / "contextual" / f"mouth_{viseme}_{context}.png"
                    cv2.imwrite(str(output_path), contextual_frame)
                    print(f"Generated contextual variant: {output_path}")
    
    print("✅ Variant generation complete!")

if __name__ == "__main__":
    main()
