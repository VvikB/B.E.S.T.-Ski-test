"""Verify files from FILE_SHA256.json in the runnable bundle."""
from pathlib import Path
import hashlib
import json
import sys
root = Path(__file__).resolve().parents[1]
manifest = root / 'FILE_SHA256.json'
if not manifest.exists():
    sys.exit('FILE_SHA256.json is supplied inside the runnable ZIP.')
failed = []
entries = json.loads(manifest.read_text())
for name, expected in entries.items():
    path = root / name
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        failed.append(name)
if failed:
    sys.exit('Mismatch: ' + ', '.join(failed))
print(f'OK: {len(entries)} files verified')
