#!/usr/bin/env python3
"""
Simple HTTP server for testing the Universal Learning System
Avoids CORS issues when running locally
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # Custom logging to show what's being served
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    import sys
    
    # Parse command line arguments
    PORT = 8000
    if len(sys.argv) > 2 and sys.argv[1] == '--port':
        try:
            PORT = int(sys.argv[2])
        except ValueError:
            print("❌ Invalid port number")
            return
    
    # Change to the directory containing the files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"🚀 Starting Universal Learning System server on port {PORT}")
    print(f"📁 Serving files from: {os.getcwd()}")
    print(f"🌐 Open your browser to: http://localhost:{PORT}")
    print(f"🧪 Test page: http://localhost:{PORT}/test-universal-system.html")
    print(f"📚 Main page: http://localhost:{PORT}/index.html")
    print(f"🎯 Complete working lesson: http://localhost:{PORT}/complete-working-lesson.html")
    print("Press Ctrl+C to stop the server")
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"✅ Server started successfully on port {PORT}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port:")
            print(f"   python3 simple-server.py --port {PORT + 1}")
        else:
            print(f"❌ Server error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main() 