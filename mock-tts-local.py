#!/usr/bin/env python3
"""Local mock TTS for immediate testing"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class MockTTSHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "engine": "mock-local"}).encode())
    
    def do_POST(self):
        if self.path == '/api/tts':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            text = data.get('text', '')
            speaker = data.get('speaker', 'kelly')
            
            # Generate mock phonemes
            phonemes = []
            duration = max(1.0, len(text) * 0.06)
            words = text.split()
            time_per_word = duration / max(len(words), 1)
            current_time = 0.0
            
            viseme_pattern = ['REST', 'A', 'E', 'MBP', 'I', 'WQ', 'REST']
            v_idx = 0
            
            for word in words:
                # Add silence
                phonemes.append({
                    "phoneme": "sil",
                    "viseme": "REST",
                    "start": current_time,
                    "end": current_time + 0.05
                })
                current_time += 0.05
                
                # Add visemes for word
                for i in range(3):
                    viseme = viseme_pattern[v_idx % len(viseme_pattern)]
                    phonemes.append({
                        "phoneme": viseme.lower(),
                        "viseme": viseme,
                        "start": current_time,
                        "end": current_time + (time_per_word - 0.1) / 3
                    })
                    current_time += (time_per_word - 0.1) / 3
                    v_idx += 1
                
                current_time += 0.05
            
            # Mock audio (base64 encoded silence)
            audio_base64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
            
            response = {
                "audio": audio_base64,
                "audio_format": "wav",
                "duration": duration,
                "speaker": speaker,
                "phonemes": phonemes
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 5002), MockTTSHandler)
    print('🎤 Mock TTS server running on http://localhost:5002')
    print('✅ Returns phoneme data for avatar sync testing')
    server.serve_forever()
