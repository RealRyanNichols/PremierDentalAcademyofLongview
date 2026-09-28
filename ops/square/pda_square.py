#!/usr/bin/env python3
"""pda-square: move Premier Dental Academy of Longview's Square notifications to the droplet.

Run it as root in the droplet's DigitalOcean web console (droplet leadflow-web):

  sudo pda-square status           read-only check, safe any time
  sudo pda-square webhook-setup    make the droplet's Square webhook (switched OFF), save its
                                   signing key in /etc/pda/api.env, restart pda-api, self-test
  sudo pda-square self-test        prove pda-api checks a signed message correctly
  sudo pda-square cutover          droplet webhook ON, Supabase webhook OFF
  sudo pda-square rollback         undo cutover: Supabase ON, droplet OFF
  sudo pda-square set-webhook-key  fallback: paste a signing key by hand (it does not show)

It uses the Square key already in /etc/pda/api.env (SQUARE_ACCESS_TOKEN) and never prints a
key or token. Nothing a student sees changes until `cutover`. Standard library only.
"""
import argparse
import base64
import datetime as dt
import getpass
import hashlib
import hmac
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

LOCATION_ID = '2P2ZE3FJNEYTV'
DROPLET_URL = 'https://www.premierdentalacademyoflongview.com/api/square-webhook'
OLD_MARK = 'supabase.co/functions/v1/square-webhook'
SUB_NAME = 'PDA droplet (pda-api)'
REQUIRED_EVENTS = ['payment.updated', 'invoice.payment_made']
API_VERSION = '2025-04-16'
SQUARE_BASE = os.environ.get('PDA_SQUARE_BASE', 'https://connect.squareup.com/v2')
BACKUP_DIR = os.environ.get('PDA_SQUARE_BACKUPS', '/root/backups/pda-square')
TRY_PUBLIC = os.environ.get('PDA_SQUARE_NO_PUBLIC') != '1'
KEY_RE = re.compile(r'^[A-Za-z0-9_\-+/=]{16,200}$')


class Stop(Exception):
    """A problem the person at the console has to fix. The message says what to do."""


def say(msg=''):
    print(msg, flush=True)


def ok(msg):
    say('  OK    ' + msg)


def warn(msg):
    say('  WARN  ' + msg)


def bad(msg):
    say('  STOP  ' + msg)


# ------------------------------------------------------------------ the env file

def read_env(path):
    vals = {}
    try:
        with open(path, encoding='utf-8') as f:
            for line in f:
                s = line.strip()
                if not s or s.startswith('#') or '=' not in s:
                    continue
                k, v = s.split('=', 1)
                k = k.strip()
                if k.startswith('export '):
                    k = k[7:].strip()
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'':
                    v = v[1:-1]
                vals[k] = v
    except FileNotFoundError:
        raise Stop(f'{path} was not found. Is this the droplet that runs pda-api?')
    except PermissionError:
        raise Stop(f"can't read {path}. Run the command with sudo.")
    return vals


def make_backup(path):
    os.makedirs(BACKUP_DIR, mode=0o700, exist_ok=True)
    stamp = dt.datetime.now().strftime('%Y%m%d-%H%M%S')
    dest = os.path.join(BACKUP_DIR, os.path.basename(path) + '.' + stamp)
    shutil.copy2(path, dest)
    os.chmod(dest, 0o600)
    return dest


def write_env(path, updates):
    """Set only these keys. Every other line, the owner and the permissions stay as they were.
    A dated copy of the old file goes to BACKUP_DIR first. The file is replaced in one step."""
    for k, v in updates.items():
        if not re.match(r'^[A-Z][A-Z0-9_]*$', k) or '\n' in v or '\r' in v:
            raise Stop('refusing to write an unsafe value into the env file')
    st = os.stat(path)
    with open(path, encoding='utf-8') as f:
        lines = f.read().splitlines()
    done, out = set(), []
    for line in lines:
        s = line.strip()
        key = None
        if s and not s.startswith('#') and '=' in s:
            key = s.split('=', 1)[0].strip()
            if key.startswith('export '):
                key = key[7:].strip()
        if key in updates:
            if key not in done:
                out.append(f'{key}={updates[key]}')
                done.add(key)
            continue
        out.append(line)
    for k, v in updates.items():
        if k not in done:
            out.append(f'{k}={v}')
    backup = make_backup(path)
    fd, tmp = tempfile.mkstemp(prefix='.pda-square.', dir=os.path.dirname(os.path.abspath(path)))
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write('\n'.join(out) + '\n')
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, stat.S_IMODE(st.st_mode))
        try:
            os.chown(tmp, st.st_uid, st.st_gid)
        except PermissionError:
            pass
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise
    return backup


# ------------------------------------------------------------------ Square

def square(method, path, token, body=None, timeout=20):
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(SQUARE_BASE + path, data=data, method=method, headers={
        'Authorization': 'Bearer ' + token,
        'Square-Version': API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode('utf-8', 'replace')
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8', 'replace')
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, {}
    except (urllib.error.URLError, OSError) as e:
        raise Stop(f'could not reach Square ({e.__class__.__name__}). Check the droplet\'s internet connection and try again.')


def sq_errors(data):
    errs = (data or {}).get('errors') or []
    return ', '.join(str(x.get('code') or x.get('category') or '?') for x in errs) or 'no details'


def token_from(env):
    token = env.get('SQUARE_ACCESS_TOKEN', '')
    if len(token) < 20:
        raise Stop('SQUARE_ACCESS_TOKEN is missing from the env file. It was copied there from Vercel on Sept 23; '
                   'ask Ryan before creating a new one. Nothing was changed.')
    return token


def check_token(token):
    code, data = square('GET', '/locations', token)
    if code in (401, 403):
        raise Stop('Square rejected SQUARE_ACCESS_TOKEN from the env file. Nothing was changed.')
    if code != 200:
        raise Stop(f'Square answered {code} ({sq_errors(data)}) to a simple check. Nothing was changed.')
    locs = data.get('locations') or []
    loc = next((l for l in locs if l.get('id') == LOCATION_ID), None)
    if not loc:
        raise Stop(f"that Square key belongs to a different Square account (Premier's location {LOCATION_ID} isn't in it). Nothing was changed.")
    return loc


def list_subs(token):
    """All webhook subscriptions of the app, or None when this key can't manage webhooks."""
    subs, cursor = [], None
    while True:
        path = '/webhooks/subscriptions?include_disabled=true'
        if cursor:
            path += '&cursor=' + urllib.parse.quote(cursor)
        code, data = square('GET', path, token)
        if code in (401, 403):
            return None
        if code != 200:
            raise Stop(f'Square answered {code} ({sq_errors(data)}) when listing webhooks. Nothing was changed.')
        subs.extend(data.get('subscriptions') or [])
        cursor = data.get('cursor')
        if not cursor:
            return subs


def split_subs(subs, url):
    new = [s for s in subs if s.get('notification_url') == url]
    old = [s for s in subs if OLD_MARK in (s.get('notification_url') or '')]
    return new, old


def set_enabled(token, sub_id, enabled):
    code, data = square('PUT', '/webhooks/subscriptions/' + urllib.parse.quote(sub_id), token,
                        {'subscription': {'enabled': bool(enabled)}})
    if code != 200:
        raise Stop(f'Square answered {code} ({sq_errors(data)}) when switching a webhook {"on" if enabled else "off"}.')
    return data.get('subscription') or {}


def new_signing_key(token, sub_id):
    code, data = square('POST', '/webhooks/subscriptions/' + urllib.parse.quote(sub_id) + '/signature-key', token,
                        {'idempotency_key': str(uuid.uuid4())})
    if code != 200 or not data.get('signature_key'):
        raise Stop(f'Square answered {code} ({sq_errors(data)}) when asked for a signing key.')
    return data['signature_key']


def describe(sub, url):
    kind = 'droplet' if sub.get('notification_url') == url else 'Supabase' if OLD_MARK in (sub.get('notification_url') or '') else 'other'
    return f"{kind:8} {'ON ' if sub.get('enabled') else 'OFF'}  {sub.get('name') or '(no name)'}  ->  {sub.get('notification_url')}  [{', '.join(sub.get('event_types') or [])}]"


def manual_steps(url):
    say(f"""
  This Square key can't manage webhooks. Square only allows that with the website app's own
  "personal access token". Do these steps by hand instead (about 5 minutes):
    1. Go to developer.squareup.com, open the app the website uses (its Application ID starts
       with sq0idp-wP-0x), then Webhooks > Subscriptions, switch to Production, Add subscription.
    2. Name: {SUB_NAME}   URL: {url}   API version: {API_VERSION}
       Events: the same ones the Supabase subscription has (at least {', '.join(REQUIRED_EVENTS)}).
       Save it, then switch it OFF for now.
    3. Open it, reveal the Signature key, copy it, and here run:  sudo pda-square set-webhook-key
       (paste it; nothing shows on screen), then:  sudo pda-square self-test
    4. When the self-test passes, switch the droplet subscription ON and the Supabase one OFF in
       that same screen. Undo = the reverse.""")


# ------------------------------------------------------------------ pda-api

def restart(a):
    if a.no_restart:
        warn(f'not restarting {a.service} (--no-restart). Restart it before the self-test counts.')
        return
    r = subprocess.run(['systemctl', 'restart', a.service], capture_output=True, text=True, timeout=90)
    if r.returncode != 0:
        raise Stop(f"couldn't restart {a.service}: {r.stderr.strip()[:200]}")
    ok(f'restarted {a.service} (checkout pauses for a second or two)')
    for _ in range(30):
        if http_get(a.api_base.rstrip('/') + '/api/square-webhook')[0]:
            return
        time.sleep(1)
    warn(f'{a.service} did not answer on {a.api_base} within 30 seconds')


def http_get(url, timeout=8):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'pda-square'}), timeout=timeout) as r:
            return r.status, _json(r.read())
    except urllib.error.HTTPError as e:
        return e.code, _json(e.read())
    except (urllib.error.URLError, OSError):
        return None, {}


def _json(raw):
    try:
        return json.loads(raw.decode('utf-8', 'replace')) if raw else {}
    except ValueError:
        return {}


def post_signed(url, key, sign_url, body, timeout=15):
    sig = base64.b64encode(hmac.new(key.encode('utf-8'), (sign_url + body).encode('utf-8'), hashlib.sha256).digest()).decode()
    req = urllib.request.Request(url, data=body.encode('utf-8'), method='POST', headers={
        'Content-Type': 'application/json',
        'x-square-hmacsha256-signature': sig,
        'User-Agent': 'pda-square-self-test',
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, _json(r.read())
    except urllib.error.HTTPError as e:
        return e.code, _json(e.read())
    except (urllib.error.URLError, OSError):
        return None, {}


# The escaped characters are on purpose: they only verify when pda-api checks the exact bytes
# it received, which is what real Square messages need.
ESCAPED_BODY = '{"type":"pda.self_test","event_id":"%s","data":{"note":"self-test \\u2014 exact bytes \\/ check"}}'
PLAIN_BODY = '{"type":"pda.self_test","event_id":"%s"}'


def self_test(a, key=None):
    env = read_env(a.env_file)
    key = key or env.get('SQUARE_WEBHOOK_SIGNATURE_KEY', '')
    sign_url = env.get('SQUARE_WEBHOOK_URL') or a.url
    if not key:
        bad(f'no SQUARE_WEBHOOK_SIGNATURE_KEY in {a.env_file}. Run: sudo pda-square webhook-setup')
        return False
    stamp = dt.datetime.now().strftime('%Y%m%d%H%M%S')
    targets = [a.api_base.rstrip('/') + '/api/square-webhook'] + ([a.url] if TRY_PUBLIC else [])
    for target in targets:
        code, body = post_signed(target, key, sign_url, ESCAPED_BODY % ('pda-self-test-' + stamp))
        if code is None:
            continue
        if code == 200 and body.get('selfTest'):
            ok(f'self-test passed at {target} (signature checked on the exact bytes: {body.get("rawSource")})')
            if not body.get('squareToken'):
                warn('pda-api has no SQUARE_ACCESS_TOKEN loaded, so real events would be retried. Restart pda-api.')
            return True
        if code == 404:
            bad(f"{target} answered 404: pda-api doesn't have /api/square-webhook yet. Update the site folder "
                f"to GitHub main (it contains api/square-webhook.js), then restart pda-api.")
            return False
        if code == 503:
            bad(f"{target} answered 503: pda-api hasn't loaded the signing key yet. Restart pda-api, then run self-test again.")
            return False
        if code == 401:
            code2, body2 = post_signed(target, key, sign_url, PLAIN_BODY % ('pda-self-test-plain-' + stamp))
            if code2 == 200 and body2.get('selfTest'):
                bad("pda-api hands the webhook a re-built copy of the message instead of the exact bytes. "
                    "Real Square messages would fail their signature check. Fix pda-api to keep the raw "
                    "request text as req.rawBody (see ops/square/README.md), restart it, run self-test again.")
            else:
                bad(f'pda-api has a different signing key than {a.env_file}. Restart pda-api so it re-reads '
                    'the file; if it still fails, run webhook-setup again.')
            return False
        bad(f'{target} answered {code}.')
        return False
    bad(f"pda-api did not answer at {' or '.join(targets)}. Check it's running: systemctl status {a.service}")
    return False


def square_test_event(token, sub_id):
    code, data = square('POST', '/webhooks/subscriptions/' + urllib.parse.quote(sub_id) + '/test', token,
                        {'event_type': 'payment.updated'}, timeout=40)
    result = (data or {}).get('subscription_test_result') or {}
    if code == 200 and result.get('status_code') in (200, 201, 202, 204):
        ok('Square sent a test event to the droplet and got a success answer (test events are ignored safely)')
    elif code == 200:
        warn(f"Square's test event got answer {result.get('status_code')} from the droplet. The self-test above is the one that counts.")
    else:
        warn(f"Square didn't send a test event ({sq_errors(data)}); that's normal while the webhook is OFF.")


def confirm(a, question):
    if a.yes:
        return True
    try:
        return input(question + ' Type yes to continue: ').strip().lower() in ('y', 'yes')
    except EOFError:
        return False


# ------------------------------------------------------------------ commands

def cmd_status(a):
    say('pda-square status (read-only)\n')
    env = read_env(a.env_file)
    has = lambda k: bool(env.get(k))
    (ok if has('SQUARE_ACCESS_TOKEN') else bad)(f"SQUARE_ACCESS_TOKEN {'is set' if has('SQUARE_ACCESS_TOKEN') else 'is MISSING'} in {a.env_file}")
    (ok if has('SQUARE_WEBHOOK_SIGNATURE_KEY') else warn)(f"SQUARE_WEBHOOK_SIGNATURE_KEY {'is set' if has('SQUARE_WEBHOOK_SIGNATURE_KEY') else 'is not set yet (run webhook-setup)'}")
    say(f"  info  SQUARE_WEBHOOK_URL = {env.get('SQUARE_WEBHOOK_URL') or '(default) ' + a.url}")
    if has('SQUARE_ACCESS_TOKEN'):
        try:
            loc = check_token(env['SQUARE_ACCESS_TOKEN'])
            ok(f"the Square key works for {loc.get('business_name') or loc.get('name')} ({LOCATION_ID})")
            subs = list_subs(env['SQUARE_ACCESS_TOKEN'])
            if subs is None:
                warn("this Square key can't list webhooks (not the app's personal access token); see webhook-setup")
            else:
                say('  webhooks in this Square app:' if subs else '  no webhooks in this Square app')
                for s in subs:
                    say('    ' + describe(s, a.url))
        except Stop as e:
            bad(str(e))
    code, body = http_get(a.api_base.rstrip('/') + '/api/square-webhook')
    if code == 200 and body.get('service') == 'square-webhook':
        ok(f"pda-api serves /api/square-webhook (signing key loaded: {'yes' if body.get('configured') else 'no'})")
    elif code == 404:
        warn('pda-api answers but has no /api/square-webhook yet (site folder is older than this change)')
    else:
        warn(f'pda-api did not answer at {a.api_base} (got {code})')
    if os.path.isdir(os.path.join(a.site_dir, '.git')):
        r = subprocess.run(['git', '-C', a.site_dir, 'log', '-1', '--format=%h %ci %s'], capture_output=True, text=True, timeout=20)
        if r.returncode == 0:
            say(f'  info  site folder {a.site_dir} is at: {r.stdout.strip()[:120]}')
    if has('SQUARE_WEBHOOK_SIGNATURE_KEY'):
        self_test(a)
    return 0


def cmd_webhook_setup(a):
    say('pda-square webhook-setup\n')
    env = read_env(a.env_file)
    token = token_from(env)
    loc = check_token(token)
    ok(f"the Square key works for {loc.get('business_name') or loc.get('name')} ({LOCATION_ID})")
    subs = list_subs(token)
    if subs is None:
        manual_steps(a.url)
        return 1
    new, old = split_subs(subs, a.url)
    events = sorted(set(e for s in old for e in (s.get('event_types') or [])) | set(REQUIRED_EVENTS))
    api_version = next((s.get('api_version') for s in old if s.get('api_version')), None) or API_VERSION
    if old:
        ok('found the Supabase webhook (' + ('ON' if any(s.get('enabled') for s in old) else 'OFF') + '); the droplet one copies its events')
    else:
        warn("no Supabase webhook in this Square app. It may live in another app; turn it off there at cutover.")
    if new:
        sub = new[0]
        ok('the droplet webhook already exists (' + ('ON' if sub.get('enabled') else 'OFF') + '); reusing it')
        if env.get('SQUARE_WEBHOOK_SIGNATURE_KEY') and (env.get('SQUARE_WEBHOOK_URL') or a.url) == a.url and not a.new_key:
            key = env['SQUARE_WEBHOOK_SIGNATURE_KEY']
            ok(f'its signing key is already in {a.env_file}')
        else:
            key = new_signing_key(token, sub['id'])
            ok('Square issued a fresh signing key for it')
    else:
        code, data = square('POST', '/webhooks/subscriptions', token, {
            'idempotency_key': str(uuid.uuid4()),
            'subscription': {'name': SUB_NAME, 'enabled': False, 'event_types': events,
                             'notification_url': a.url, 'api_version': api_version},
        })
        if code in (401, 403):
            manual_steps(a.url)
            return 1
        if code != 200:
            raise Stop(f"Square wouldn't create the webhook ({sq_errors(data)}). Nothing was changed.")
        sub = data.get('subscription') or {}
        ok('created the droplet webhook, switched OFF for now: ' + ', '.join(events))
        if sub.get('enabled'):
            sub = set_enabled(token, sub['id'], False) or sub
            ok('switched it OFF until cutover')
        key = (data.get('subscription') or {}).get('signature_key') or new_signing_key(token, sub['id'])
    if not KEY_RE.match(key or ''):
        raise Stop("Square returned a signing key in an unexpected format. Nothing was saved.")
    backup = write_env(a.env_file, {'SQUARE_WEBHOOK_SIGNATURE_KEY': key, 'SQUARE_WEBHOOK_URL': a.url})
    ok(f'saved the signing key and URL in {a.env_file} (old copy: {backup})')
    restart(a)
    if not self_test(a, key):
        return 1
    square_test_event(token, sub['id'])
    say('\nReady. Nothing changed for students: the Supabase webhook still handles payments.\n'
        'When you want the droplet to take over, run:  sudo pda-square cutover')
    return 0


def cmd_self_test(a):
    return 0 if self_test(a) else 1


def _switch(a, droplet_on):
    env = read_env(a.env_file)
    token = token_from(env)
    check_token(token)
    subs = list_subs(token)
    if subs is None:
        manual_steps(a.url)
        return 1
    new, old = split_subs(subs, a.url)
    if not new:
        bad('there is no droplet webhook yet. Run: sudo pda-square webhook-setup')
        return 1
    if droplet_on:
        if not self_test(a):
            bad('not switching: the self-test has to pass first. Nothing changed.')
            return 1
        if not confirm(a, 'Switch Square payment notifications from Supabase to the droplet?'):
            say('Nothing changed.')
            return 1
        set_enabled(token, new[0]['id'], True)
        ok('droplet webhook ON')
        for s in old:
            if s.get('enabled'):
                set_enabled(token, s['id'], False)
                ok('Supabase webhook OFF')
        if not old:
            warn("no Supabase webhook in this Square app to switch off. Check the Square Developer Console so both aren't on.")
        say('\nDone. Payments now reach the droplet. Undo any time with:  sudo pda-square rollback')
    else:
        if not confirm(a, 'Switch Square payment notifications back to Supabase?'):
            say('Nothing changed.')
            return 1
        for s in old:
            set_enabled(token, s['id'], True)
            ok('Supabase webhook ON')
        set_enabled(token, new[0]['id'], False)
        ok('droplet webhook OFF')
        if not old:
            warn('no Supabase webhook found to switch back on. Payments are not being delivered anywhere until one is on.')
            return 1
        say('\nRolled back. Supabase handles Square payments again.')
    return 0


def cmd_cutover(a):
    say('pda-square cutover\n')
    return _switch(a, True)


def cmd_rollback(a):
    say('pda-square rollback\n')
    return _switch(a, False)


def cmd_set_webhook_key(a):
    say('pda-square set-webhook-key\n')
    read_env(a.env_file)
    if a.stdin:
        key = sys.stdin.readline().strip()
    else:
        key = getpass.getpass('Paste the signing key from the Square Developer Console (it will not show), then press Enter: ').strip()
    if not KEY_RE.match(key):
        raise Stop("that doesn't look like a Square signing key (letters, numbers and - _ + / = only). Nothing was saved.")
    backup = write_env(a.env_file, {'SQUARE_WEBHOOK_SIGNATURE_KEY': key, 'SQUARE_WEBHOOK_URL': a.url})
    ok(f'saved (old copy: {backup})')
    restart(a)
    return 0 if self_test(a, key) else 1


def main(argv=None):
    p = argparse.ArgumentParser(prog='pda-square', description='Move Square payment notifications to the droplet.')
    p.add_argument('command', choices=['status', 'webhook-setup', 'self-test', 'cutover', 'rollback', 'set-webhook-key'])
    p.add_argument('--env-file', default='/etc/pda/api.env')
    p.add_argument('--service', default='pda-api')
    p.add_argument('--api-base', default='http://127.0.0.1:3200', help='where pda-api listens on this server')
    p.add_argument('--url', default=DROPLET_URL, help='the public webhook address Square signs')
    p.add_argument('--site-dir', default='/srv/sites/pda')
    p.add_argument('--no-restart', action='store_true', help="don't restart pda-api after saving the key")
    p.add_argument('--new-key', action='store_true', help='webhook-setup: ask Square for a fresh signing key')
    p.add_argument('--stdin', action='store_true', help='set-webhook-key: read the key from standard input')
    p.add_argument('--yes', action='store_true', help='skip the confirmation question')
    a = p.parse_args(argv)
    cmds = {'status': cmd_status, 'webhook-setup': cmd_webhook_setup, 'self-test': cmd_self_test,
            'cutover': cmd_cutover, 'rollback': cmd_rollback, 'set-webhook-key': cmd_set_webhook_key}
    try:
        return cmds[a.command](a)
    except Stop as e:
        bad(str(e))
        return 1
    except KeyboardInterrupt:
        say('\nStopped. Nothing further was changed.')
        return 1


if __name__ == '__main__':
    sys.exit(main())
