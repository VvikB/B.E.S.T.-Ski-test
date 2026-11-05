"""Serve the built D0.3 locally without Node.js. Not a production/auth server."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


class DemoHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path.rstrip('/') in ('', '/ski', '/kids', '/pro', '/lab'):
            self.path = '/index.html'
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404)
        return None


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=5173)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent.parent / 'dist'
    if not (directory / 'index.html').is_file():
        parser.error('No dist/index.html. Run npm run build or use the runnable release archive.')
    handler = partial(DemoHandler, directory=str(directory))
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f'D0.3 technical demo: http://{args.host}:{args.port}/ski', flush=True)
    print('Synthetic data only; no authentication. Use only a trusted local network.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
