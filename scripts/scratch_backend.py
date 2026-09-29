#!/usr/bin/env python3
"""Run backend commands only against the named local scratch container.

Usage: python scripts/scratch_backend.py pytest -q
Container credentials are read in memory and never printed. No Neon URL is used.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
info = json.loads(subprocess.check_output(['docker', 'inspect', 'coopsetu-scratch-pg'], text=True))[0]
config = dict(item.split('=', 1) for item in info['Config']['Env'] if '=' in item)
ports = info['NetworkSettings']['Ports'].get('5432/tcp') or []
if not any(p['HostIp'] == '127.0.0.1' and p['HostPort'] == '55432' for p in ports):
    raise SystemExit('Expected loopback-only scratch Postgres on port 55432')
user = config.get('POSTGRES_USER', 'postgres')
db = config.get('POSTGRES_DB', user)
password = config.get('POSTGRES_PASSWORD', '')
env = dict(os.environ)
dotenv_path = ROOT / 'backend' / '.env'
if dotenv_path.is_file():
    for line in dotenv_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env.setdefault(k.strip(), v.strip())

env.update(DATABASE_URL=f'postgresql://{quote(user, safe="")}:{quote(password, safe="")}@127.0.0.1:55432/{quote(db, safe="")}',
           DATABASE_URL_PROD='',
           INTERNAL_API_SECRET=env.get('INTERNAL_API_SECRET', 'scratch-internal-only'),
           CERTIFICATE_SIGNING_SECRET=env.get('CERTIFICATE_SIGNING_SECRET', 'scratch-certificate-signing-only'),
           APP_ENV='development',
           ALLOW_ANONYMOUS_ACTOR='true',
           DEMO_LOGIN_ENABLED='true')
args = sys.argv[1:]
if not args:
    raise SystemExit('Specify a backend command, e.g. pytest -q')
raise SystemExit(subprocess.call(args, cwd=ROOT / 'backend', env=env))
