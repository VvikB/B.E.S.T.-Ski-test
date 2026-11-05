"""Package the local D0.2 source + production build; never includes .git or node_modules."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
output = root.parent / 'BEST_ACADEMY_D02_RUNNABLE.zip'
allowed = ['src', 'public', 'tests', 'tools', 'docs', 'dist']
files = [p for name in allowed for p in (root / name).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
files += [p for p in root.iterdir() if p.is_file() and p.name in {
    'README.md', 'README_D02.md', 'package.json', 'package-lock.json', 'index.html',
    'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts',
    'playwright.config.ts', '.gitignore'
}]
# A manifest inside the ZIP excludes itself to avoid circular hashes.
manifest = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(files):
        archive.write(p, 'B.E.S.T.-Academy-D0.2/' + str(p.relative_to(root)))
    archive.writestr('B.E.S.T.-Academy-D0.2/FILE_SHA256.json', json.dumps(manifest, indent=2, ensure_ascii=False))
print(output)
print(hashlib.sha256(output.read_bytes()).hexdigest())
