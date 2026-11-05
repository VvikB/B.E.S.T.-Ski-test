"""Local TLS server for the existing D0.3 dist. No authentication; trusted LAN only."""
import ssl
from argparse import ArgumentParser
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
from serve_demo import DemoHandler


class HttpsDemoHandler(DemoHandler):
    def do_GET(self):
        relative = unquote(urlsplit(self.path).path).lstrip('/')
        root = Path(self.directory).resolve()
        candidate = (root / relative).resolve()
        # Never expose symlink targets outside dist, dotfiles or repository sources.
        if not candidate.is_relative_to(root) or any(p.startswith('.') for p in Path(relative).parts):
            self.send_error(403)
            return
        super().do_GET()

    def do_HEAD(self):
        # HEAD performs the same path validation without returning a response body.
        self.do_GET()

    def copyfile(self, source, outputfile):
        if self.command != 'HEAD':
            super().copyfile(source, outputfile)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=5443)
    parser.add_argument('--cert', type=Path, required=True)
    parser.add_argument('--key', type=Path, required=True)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parents[1] / 'dist'
    if not (directory / 'index.html').is_file():
        parser.error('Missing dist/index.html; use the D0.3 runnable build or npm run build.')
    for path in (args.cert, args.key):
        if path.resolve().is_relative_to(directory.resolve()):
            parser.error('Certificates and private keys must be outside dist.')
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    try:
        context.load_cert_chain(args.cert, args.key)
    except (OSError, ssl.SSLError) as error:
        parser.error(f'Cannot load TLS certificate/key: {error}')
    server = ThreadingHTTPServer((args.host, args.port), partial(HttpsDemoHandler, directory=str(directory)))
    server.socket = context.wrap_socket(server.socket, server_side=True)
    print(f'D0.3 HTTPS: https://{args.host}:{args.port}/lab', flush=True)
    print('No authentication. Trusted LAN only. Do not forward this port to the Internet.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
