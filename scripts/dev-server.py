import http.server
import json
import os
import subprocess
from urllib.parse import urlsplit

DIRECTORY = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Chaua-Educa-main')
PORT = 5501
HOST = '127.0.0.1'

def build_info():
    root = os.path.dirname(DIRECTORY)
    def git(*args):
        return subprocess.check_output(
            ['git', '-C', root, *args], text=True, stderr=subprocess.DEVNULL
        ).strip()
    try:
        # Servers started from a source archive may have no Git metadata.
        if os.path.realpath(git('rev-parse', '--show-toplevel')) != os.path.realpath(root):
            return {'gitCommit': None}
        commit = git('rev-parse', 'HEAD')
        dirty = bool(git('status', '--porcelain', '--', 'Chaua-Educa-main'))
        return {'gitCommit': commit, 'dirty': dirty}
    except (OSError, subprocess.CalledProcessError):
        return {'gitCommit': None}


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if urlsplit(self.path).path != '/build-info.json':
            return super().do_GET()
        content = json.dumps(build_info()).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

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
