"""Tests for ops/square/pda_square.py. Fictional data only; nothing leaves this machine.

A fake Square API (threaded HTTP server) stands in for connect.squareup.com, and the REAL
api/square-webhook.js runs behind fake-pda-api.mjs, so the tool's signed self-test is verified
by the exact code that will run on the droplet.

    python3 ops/square/tests/test_pda_square.py
"""
import json
import os
import shutil
import socket
import stat
import subprocess
import sys
import tempfile
import threading
import time
import unittest
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, '..', 'pda_square.py')
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
URL = 'https://www.premierdentalacademyoflongview.com/api/square-webhook'
OLD_URL = 'https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/square-webhook'
GOOD_TOKEN = 'EAAA-synthetic-personal-access-token-for-tests'
OTHER_TOKEN = 'EAAA-synthetic-token-for-a-different-account'


def read(path):
    with open(path) as f:
        return f.read()


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class FakeSquare:
    def __init__(self):
        self.subs = {}
        self.forbid_webhooks = False
        self.ignore_disabled_on_create = False
        self.keys_issued = []
        self.tests_sent = 0
        old = {'id': 'wbhk_old', 'name': 'Supabase', 'enabled': True, 'event_types': ['payment.updated', 'invoice.payment_made'],
               'notification_url': OLD_URL, 'api_version': '2025-04-16'}
        self.subs[old['id']] = old

    def new_key(self):
        k = 'synthKey_' + uuid.uuid4().hex
        self.keys_issued.append(k)
        return k


def make_handler(fs):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, obj):
            raw = json.dumps(obj).encode()
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def _auth(self):
            return self.headers.get('Authorization', '').replace('Bearer ', '')

        def _body(self):
            n = int(self.headers.get('Content-Length') or 0)
            return json.loads(self.rfile.read(n) or b'{}')

        def do_GET(self):
            tok = self._auth()
            if tok not in (GOOD_TOKEN, OTHER_TOKEN):
                return self._send(401, {'errors': [{'code': 'UNAUTHORIZED'}]})
            if self.path.startswith('/v2/locations'):
                loc_id = '2P2ZE3FJNEYTV' if tok == GOOD_TOKEN else 'SOMEONEELSE'
                return self._send(200, {'locations': [{'id': loc_id, 'business_name': 'Synthetic School'}]})
            if self.path.startswith('/v2/webhooks/subscriptions'):
                if fs.forbid_webhooks:
                    return self._send(403, {'errors': [{'code': 'INSUFFICIENT_SCOPES'}]})
                subs = [{k: v for k, v in s.items() if k != 'signature_key'} for s in fs.subs.values()]
                return self._send(200, {'subscriptions': subs})
            return self._send(404, {'errors': [{'code': 'NOT_FOUND'}]})

        def do_POST(self):
            if self._auth() != GOOD_TOKEN:
                return self._send(401, {'errors': [{'code': 'UNAUTHORIZED'}]})
            body = self._body()
            parts = self.path.split('?')[0].strip('/').split('/')
            if parts == ['v2', 'webhooks', 'subscriptions']:
                if fs.forbid_webhooks:
                    return self._send(403, {'errors': [{'code': 'INSUFFICIENT_SCOPES'}]})
                s = dict(body['subscription'])
                s['id'] = 'wbhk_' + uuid.uuid4().hex[:8]
                if fs.ignore_disabled_on_create:
                    s['enabled'] = True
                s['signature_key'] = fs.new_key()
                fs.subs[s['id']] = s
                return self._send(200, {'subscription': s})
            if len(parts) == 5 and parts[4] == 'signature-key':
                s = fs.subs[parts[3]]
                s['signature_key'] = fs.new_key()
                return self._send(200, {'signature_key': s['signature_key']})
            if len(parts) == 5 and parts[4] == 'test':
                fs.tests_sent += 1
                return self._send(200, {'subscription_test_result': {'status_code': 200}})
            return self._send(404, {'errors': [{'code': 'NOT_FOUND'}]})

        def do_PUT(self):
            if self._auth() != GOOD_TOKEN:
                return self._send(401, {'errors': [{'code': 'UNAUTHORIZED'}]})
            body = self._body()
            parts = self.path.strip('/').split('/')
            s = fs.subs.get(parts[3])
            if not s:
                return self._send(404, {'errors': [{'code': 'NOT_FOUND'}]})
            s.update({k: v for k, v in body.get('subscription', {}).items() if k in ('enabled', 'event_types', 'name')})
            return self._send(200, {'subscription': {k: v for k, v in s.items() if k != 'signature_key'}})
    return H


class ToolTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix='pda-square-test-')
        self.env = os.path.join(self.tmp, 'api.env')
        with open(self.env, 'w') as f:
            f.write('# pda-api settings\nSUPABASE_URL=https://example.invalid\nSQUARE_ACCESS_TOKEN=' + GOOD_TOKEN + '\nRESEND_FROM=Test <test@example.invalid>\n')
        os.chmod(self.env, 0o600)
        self.fs = FakeSquare()
        self.sq_port = free_port()
        self.srv = ThreadingHTTPServer(('127.0.0.1', self.sq_port), make_handler(self.fs))
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        self.api = None

    def tearDown(self):
        self.srv.shutdown()
        self.srv.server_close()
        self.stop_api()
        shutil.rmtree(self.tmp, ignore_errors=True)

    def stop_api(self):
        if self.api:
            self.api.terminate()
            self.api.wait(timeout=5)
            self.api.stdout.close()
            self.api = None

    def start_api(self, mode='raw'):
        port = free_port()
        self.api = subprocess.Popen(['node', os.path.join(HERE, 'fake-pda-api.mjs'), str(port), self.env, mode, REPO],
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        line = self.api.stdout.readline()
        self.assertIn('ready', line)
        self.api_base = f'http://127.0.0.1:{port}'
        return self.api_base

    def run_tool(self, *args, stdin=None):
        env = dict(os.environ, PDA_SQUARE_BASE=f'http://127.0.0.1:{self.sq_port}/v2', PDA_SQUARE_BACKUPS=os.path.join(self.tmp, 'backups'), PDA_SQUARE_NO_PUBLIC='1')
        base = getattr(self, 'api_base', 'http://127.0.0.1:9')
        cmd = [sys.executable, TOOL, *args, '--env-file', self.env, '--api-base', base, '--no-restart', '--site-dir', self.tmp]
        r = subprocess.run(cmd, capture_output=True, text=True, env=env, input=stdin, timeout=120)
        out = r.stdout + r.stderr
        # Nothing secret may ever be printed.
        self.assertNotIn(GOOD_TOKEN, out)
        for k in self.fs.keys_issued:
            self.assertNotIn(k, out)
        return r.returncode, out

    def env_values(self):
        vals = {}
        for line in read(self.env).splitlines(True):
            if '=' in line and not line.startswith('#'):
                k, v = line.rstrip('\n').split('=', 1)
                vals[k] = v
        return vals

    def droplet_sub(self):
        return next((s for s in self.fs.subs.values() if s['notification_url'] == URL), None)

    # ---------------------------------------------------------------- tests

    def test_setup_creates_off_webhook_saves_key_and_self_test_passes(self):
        self.start_api('raw')
        code, out = self.run_tool('webhook-setup')
        self.assertEqual(code, 0, out)
        sub = self.droplet_sub()
        self.assertIsNotNone(sub)
        self.assertFalse(sub['enabled'], 'created switched OFF')
        self.assertEqual(sorted(sub['event_types']), ['invoice.payment_made', 'payment.updated'])
        self.assertTrue(self.fs.subs['wbhk_old']['enabled'], 'Supabase webhook untouched')
        vals = self.env_values()
        self.assertEqual(vals['SQUARE_WEBHOOK_SIGNATURE_KEY'], sub['signature_key'])
        self.assertEqual(vals['SQUARE_WEBHOOK_URL'], URL)
        self.assertEqual(vals['SUPABASE_URL'], 'https://example.invalid', 'other settings kept')
        self.assertEqual(stat.S_IMODE(os.stat(self.env).st_mode), 0o600, 'permissions kept')
        self.assertIn('# pda-api settings', read(self.env), 'comments kept')
        backups = os.listdir(os.path.join(self.tmp, 'backups'))
        self.assertEqual(len(backups), 1)
        self.assertIn('self-test passed', out)
        self.assertIn('rawBody', out)
        self.assertEqual(self.fs.tests_sent, 1)

    def test_setup_twice_reuses_the_webhook(self):
        self.start_api('raw')
        self.assertEqual(self.run_tool('webhook-setup')[0], 0)
        code, out = self.run_tool('webhook-setup')
        self.assertEqual(code, 0, out)
        self.assertEqual(sum(1 for s in self.fs.subs.values() if s['notification_url'] == URL), 1)
        self.assertIn('reusing it', out)

    def test_square_ignoring_enabled_false_is_switched_off(self):
        self.fs.ignore_disabled_on_create = True
        self.start_api('raw')
        code, out = self.run_tool('webhook-setup')
        self.assertEqual(code, 0, out)
        self.assertFalse(self.droplet_sub()['enabled'])

    def test_self_test_catches_a_server_that_drops_the_raw_body(self):
        self.start_api('parsed')
        code, out = self.run_tool('webhook-setup')
        self.assertEqual(code, 1, out)
        self.assertIn('exact bytes', out)
        self.assertIn('req.rawBody', out)

    def test_self_test_catches_a_key_mismatch(self):
        self.start_api('raw')
        self.assertEqual(self.run_tool('webhook-setup')[0], 0)
        other_env = os.path.join(self.tmp, 'other.env')
        text = read(self.env)
        key = self.env_values()['SQUARE_WEBHOOK_SIGNATURE_KEY']
        with open(other_env, 'w') as f:
            f.write(text.replace(key, 'a-different-key-0000000000'))
        env = dict(os.environ, PDA_SQUARE_BASE=f'http://127.0.0.1:{self.sq_port}/v2', PDA_SQUARE_NO_PUBLIC='1')
        r = subprocess.run([sys.executable, TOOL, 'self-test', '--env-file', other_env, '--api-base', self.api_base], capture_output=True, text=True, env=env)
        self.assertEqual(r.returncode, 1)
        self.assertIn('different signing key', r.stdout)

    def test_cutover_and_rollback(self):
        self.start_api('raw')
        self.assertEqual(self.run_tool('webhook-setup')[0], 0)
        code, out = self.run_tool('cutover', '--yes')
        self.assertEqual(code, 0, out)
        self.assertTrue(self.droplet_sub()['enabled'])
        self.assertFalse(self.fs.subs['wbhk_old']['enabled'])
        code, out = self.run_tool('rollback', '--yes')
        self.assertEqual(code, 0, out)
        self.assertFalse(self.droplet_sub()['enabled'])
        self.assertTrue(self.fs.subs['wbhk_old']['enabled'])

    def test_cutover_refuses_without_a_passing_self_test(self):
        self.start_api('raw')
        self.assertEqual(self.run_tool('webhook-setup')[0], 0)
        self.stop_api()
        code, out = self.run_tool('cutover', '--yes')
        self.assertEqual(code, 1, out)
        self.assertFalse(self.droplet_sub()['enabled'])
        self.assertTrue(self.fs.subs['wbhk_old']['enabled'])

    def test_cutover_needs_a_yes(self):
        self.start_api('raw')
        self.assertEqual(self.run_tool('webhook-setup')[0], 0)
        code, out = self.run_tool('cutover', stdin='no\n')
        self.assertEqual(code, 1)
        self.assertFalse(self.droplet_sub()['enabled'])

    def test_wrong_square_account_changes_nothing(self):
        with open(self.env, 'w') as f:
            f.write('SQUARE_ACCESS_TOKEN=' + OTHER_TOKEN + '\n')
        before = read(self.env)
        code, out = self.run_tool('webhook-setup')
        self.assertEqual(code, 1)
        self.assertIn('different Square account', out)
        self.assertEqual(read(self.env), before)
        self.assertIsNone(self.droplet_sub())

    def test_key_without_webhook_rights_prints_manual_steps(self):
        self.fs.forbid_webhooks = True
        before = read(self.env)
        code, out = self.run_tool('webhook-setup')
        self.assertEqual(code, 1)
        self.assertIn('developer.squareup.com', out)
        self.assertIn('set-webhook-key', out)
        self.assertEqual(read(self.env), before)

    def test_missing_token_stops(self):
        with open(self.env, 'w') as f:
            f.write('SUPABASE_URL=x\n')
        code, out = self.run_tool('webhook-setup')
        self.assertEqual(code, 1)
        self.assertIn('SQUARE_ACCESS_TOKEN is missing', out)

    def test_set_webhook_key_by_hand(self):
        self.start_api('raw')
        code, out = self.run_tool('set-webhook-key', '--stdin', stdin='handPastedKey_1234567890\n')
        self.assertEqual(code, 0, out)
        self.assertEqual(self.env_values()['SQUARE_WEBHOOK_SIGNATURE_KEY'], 'handPastedKey_1234567890')
        self.assertNotIn('handPastedKey_1234567890', out)
        code, out = self.run_tool('set-webhook-key', '--stdin', stdin='bad key with spaces\n')
        self.assertEqual(code, 1)

    def test_status_is_read_only(self):
        self.start_api('raw')
        before = read(self.env)
        code, out = self.run_tool('status')
        self.assertEqual(code, 0, out)
        self.assertIn('Supabase', out)
        self.assertIn('pda-api serves /api/square-webhook', out)
        self.assertEqual(read(self.env), before)


if __name__ == '__main__':
    unittest.main(verbosity=2)
