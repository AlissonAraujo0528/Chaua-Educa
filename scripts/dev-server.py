import http.server
import os
import sys

DIRECTORY = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Chaua-Educa-main')
PORT = 5501
HOST = '127.0.0.1'

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    with http.server.ThreadingHTTPServer((HOST, PORT), NoCacheHandler) as httpd:
        print(f"Serving {DIRECTORY} on http://{HOST}:{PORT}/ with no-cache headers...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
