"""Targeted HTTPS tests; ephemeral certificates outside the repository."""
import json
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path


class HttpsAcceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='best-https-')
        cls.root = Path(cls.temp.name)
        app = Path(__file__).resolve().parents[1]
        shutil.copytree(app / 'dist', cls.root / 'dist')
        (cls.root / 'tools').mkdir()
        for name in ['serve_demo.py', 'serve_https.py']:
            shutil.copyfile(app / 'tools' / name, cls.root / 'tools' / name)
        cls.cert = cls.root / 'test.pem'
        cls.key = cls.root / 'test.key'
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                        '-keyout', str(cls.key), '-out', str(cls.cert), '-days', '1',
                        '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); cls.port = sock.getsockname()[1]
        cls.base = f'https://127.0.0.1:{cls.port}'
        cls.context = ssl.create_default_context(cafile=str(cls.cert))
        cls.server = subprocess.Popen([sys.executable, str(cls.root / 'tools/serve_https.py'),
            '--port', str(cls.port), '--cert', str(cls.cert), '--key', str(cls.key)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(50):
            try:
                cls.fetch('/lab').close(); break
            except OSError: time.sleep(.1)
        else: raise RuntimeError('HTTPS server did not start')

    @classmethod
    def fetch(cls, path, method='GET'):
        return urllib.request.urlopen(urllib.request.Request(cls.base + path, method=method), context=cls.context, timeout=5)

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate(); cls.server.wait(timeout=5); cls.temp.cleanup()

    def test_routes_and_head(self):
        for route in ['/kids', '/ski', '/pro', '/lab']:
            with self.fetch(route) as r:
                self.assertEqual(r.status, 200)
                self.assertIn(b'<html', r.read())
            with self.fetch(route, 'HEAD') as r:
                self.assertEqual(r.status, 200); self.assertEqual(r.read(), b'')

    def test_security_headers(self):
        with self.fetch('/lab') as r:
            self.assertEqual(r.headers['Cache-Control'], 'no-store')
            self.assertEqual(r.headers['X-Content-Type-Options'], 'nosniff')
            self.assertGreaterEqual(r.fp.raw._sock.version(), 'TLSv1.2')

    def test_external_symlink_and_encoded_traversal_blocked(self):
        (self.root / 'dist' / 'outside-key').symlink_to(self.key)
        for path in ['/outside-key', '/%2e%2e/test.key']:
            with self.assertRaises(urllib.error.HTTPError) as e: self.fetch(path)
            self.assertEqual(e.exception.code, 403)

    def test_dotfiles_sources_and_directory_listing_not_exposed(self):
        (self.root / 'dist' / '.hidden').write_text('not served')
        for path, status in [('/.hidden',403), ('/tools/serve_demo.py',404), ('/assets/',404)]:
            with self.assertRaises(urllib.error.HTTPError) as e: self.fetch(path)
            self.assertEqual(e.exception.code,status)

    def test_untrusted_certificate_rejected(self):
        with self.assertRaises(urllib.error.URLError):
            urllib.request.urlopen(self.base + '/lab',context=ssl.create_default_context(),timeout=5)

    def test_private_key_inside_dist_rejected(self):
        result = subprocess.run([sys.executable,str(self.root/'tools/serve_https.py'),
            '--cert',str(self.root/'dist'/'test.pem'),'--key',str(self.root/'dist'/'test.key')],
            capture_output=True,text=True)
        self.assertEqual(result.returncode,2)
        self.assertIn('outside dist',result.stderr)

    def test_https_browser_3d_svg(self):
        # Chromium exception applies only to this ephemeral self-signed test cert.
        # Python tests above verify real CA/hostname validation; no iOS trust claimed.
        script = '''
import { chromium } from '@playwright/test';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const context=await browser.newContext({ignoreHTTPSErrors:true});
 const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.argv[1]+'/lab');
 await page.locator('canvas').waitFor({state:'visible'});
 await page.getByRole('button',{name:'Перейти к кадру 60',exact:true}).click();
 await page.getByRole('button',{name:'SVG',exact:true}).click();
 await page.locator('[data-testid="svg-rig"]').first().waitFor({state:'visible'});
 if(await page.getByTestId('scene').getAttribute('data-frame')!=='60')throw Error('Lost SVG frame');
 await page.getByRole('button',{name:'3D',exact:true}).click();
 await page.locator('canvas').waitFor({state:'visible'});
 if(errors.length)throw Error(errors.join(';'));
} finally { await browser.close(); }
'''
        subprocess.run(['node','--input-type=module','-e',script,self.base],
                       cwd=Path(__file__).resolve().parents[1],check=True,timeout=45)


if __name__ == '__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(HttpsAcceptance)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    report={'targeted_tests_run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),
            'python_tls_ca_and_hostname_validation':result.wasSuccessful(),
            'browser':'Linux Chromium, ephemeral self-signed certificate exception only for browser smoke',
            'physical_iPhone_tested':False,'mac_mkcert_flow_tested':False,'methodical_approval':False}
    output=Path(__file__).resolve().parents[2]/'docs/next/CHECKS.json'
    output.write_text(json.dumps(report,indent=2))
    sys.exit(0 if result.wasSuccessful() else 1)
