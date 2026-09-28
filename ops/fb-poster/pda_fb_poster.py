#!/usr/bin/env python3
"""pda-fb-poster: keeps Premier Dental Academy of Longview's Facebook Page schedule full.

Runs on the droplet from a systemd timer every 15 minutes. Each run:

  1. reads the approved post queue (JSON files in the queue folder, plus any
     remote queue URLs listed in the config),
  2. finds every approved post whose time is now inside Facebook's scheduling
     window (the Graph API accepts 10 minutes to 30 days ahead; we use 29.5 days),
  3. leaves alone any time slot that already has a post on the Page's schedule
     (for example one put there by hand in Business Suite),
  4. schedules the rest through the Graph API, and
  5. records every step in a small ledger, so nothing is ever scheduled twice.

Anything that fails the content rules (retired prices, wrong phone number,
unapproved dates or class hours, night-class claims, and so on) is held back and
reported instead of posted.

The access token is read from a root-owned file and is never printed or logged.
Python standard library only (3.9+).

Commands (run with sudo on the droplet):
  pda-fb-poster status              what is scheduled, waiting, held or failed
  pda-fb-poster run [--dry-run]     one pass (the timer does this every 15 minutes)
  pda-fb-poster set-token           paste a new Facebook token (input is hidden)
  pda-fb-poster check               test the saved token (prints no secrets)
  pda-fb-poster validate FILE       check a queue file against the content rules
  pda-fb-poster import FILE         validate a queue file and add it to the queue
  pda-fb-poster pause | resume      stop / restart all scheduling
  pda-fb-poster requeue KEY         let a post that was removed by hand be scheduled again
"""
from __future__ import annotations

import argparse
import datetime as dt
import fcntl
import getpass
import glob
import hashlib
import json
import os
import pwd
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from zoneinfo import ZoneInfo

VERSION = "1.0.0"
CT = ZoneInfo("America/Chicago")
DEFAULT_CONFIG = "/etc/pda-fb-poster/poster.env"
QUEUE_FORMAT = "pda-fb-queue/1"
SITE = "https://www.premierdentalacademyoflongview.com/"
PHONE = "(903) 913-6444"

# ------------------------------------------------------------------ config


def load_config() -> dict:
    path = os.environ.get("PDAFB_CONFIG", DEFAULT_CONFIG)
    file_vals: dict = {}
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                file_vals[k.strip()] = v.strip().strip('"').strip("'")
    except (FileNotFoundError, PermissionError):
        pass

    def get(name: str, default: str) -> str:
        return os.environ.get(name, file_vals.get(name, default))

    data = get("PDAFB_DATA", "/var/lib/pda-fb-poster")
    return {
        "config_path": path,
        "page_id": get("PDAFB_PAGE_ID", "180743142587539"),
        "page_name": get("PDAFB_PAGE_NAME", "Premier Dental Academy of Longview"),
        "graph": get("PDAFB_GRAPH", "https://graph.facebook.com/v23.0").rstrip("/"),
        "data": data,
        "queue_dir": get("PDAFB_QUEUE_DIR", os.path.join(data, "queue")),
        "photos_dir": get("PDAFB_PHOTOS_DIR", os.path.join(data, "photos")),
        "token_file": get("PDAFB_TOKEN_FILE", "/etc/pda-fb-poster/token"),
        "remote_queues": [u for u in get("PDAFB_REMOTE_QUEUES", "").split() if u],
        "window_days": float(get("PDAFB_WINDOW_DAYS", "29.5")),
        "min_lead_min": float(get("PDAFB_MIN_LEAD_MIN", "20")),
        "start_after": get("PDAFB_START_AFTER", ""),
        "max_per_run": int(get("PDAFB_MAX_PER_RUN", "40")),
        "upgrade_images": get("PDAFB_UPGRADE_IMAGES", "1") == "1",
        "timeout": float(get("PDAFB_TIMEOUT", "40")),
        "user": get("PDAFB_USER", "pdafb"),
        "now": get("PDAFB_NOW", ""),  # tests only: pretend it is this time (ISO 8601 with offset)
    }


# ------------------------------------------------------------------- time


def now_ts(cfg: dict) -> int:
    if cfg.get("now"):
        return int(dt.datetime.fromisoformat(cfg["now"]).timestamp())
    return int(time.time())


def slot_ts(date_s: str, time_s: str) -> int:
    d = dt.date.fromisoformat(date_s)
    h, m = (int(x) for x in time_s.split(":"))
    return int(dt.datetime(d.year, d.month, d.day, h, m, tzinfo=CT).timestamp())


def ct_label(ts: int) -> str:
    t = dt.datetime.fromtimestamp(ts, CT)
    return t.strftime("%a %b ") + str(t.day) + ", " + t.strftime("%I:%M %p").lstrip("0")


def ct_stamp(ts: int | None = None) -> str:
    t = dt.datetime.fromtimestamp(ts if ts is not None else time.time(), CT)
    return t.strftime("%Y-%m-%d %H:%M:%S %Z")


def parse_fb_time(v) -> int | None:
    """Graph API returns scheduled_publish_time as a unix number; created_time as ISO 8601."""
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v)
    if re.fullmatch(r"\d+(\.\d+)?", s):
        return int(float(s))
    s = s.replace("Z", "+00:00")
    if re.search(r"[+-]\d{4}$", s):
        s = s[:-2] + ":" + s[-2:]
    return int(dt.datetime.fromisoformat(s).timestamp())


# ------------------------------------------------------------------ logging


def log(msg: str) -> None:
    print(f"{ct_stamp()} {scrub(msg)}", flush=True)


_TOKEN_RE = re.compile(r"EAA[A-Za-z0-9]{16,}")
_QS_TOKEN_RE = re.compile(r"(access_token|input_token)=[^&\s\"']+")


def scrub(s: str) -> str:
    """Never let anything that looks like a token reach a log line or the status file."""
    s = _TOKEN_RE.sub("[token]", str(s))
    return _QS_TOKEN_RE.sub(r"\1=[token]", s)


# ------------------------------------------------------------ content rules

MONTHS = ("January|February|March|April|May|June|July|August|September|October|"
          "November|December")
DEFAULT_ALLOWED_MONEY = ["$3,000", "$3,500", "$500", "$997"]
APPROVED_CLASS_TIMES = ["8:30 AM", "12:30 PM", "9:00 AM", "3:00 PM"]
BANNED = [
    (r"—|–", "em or en dash (use commas, periods or a plain hyphen)"),
    (r"(?<![\w&])#[A-Za-z]\w*", "hashtag"),
    (r"(?i)\bpremiere\b", "misspelled name (Premiere)"),
    (r"\$1,997|\$4,998|\$200\b|\$1,497", "retired price"),
    (r"(?i)\$200 (down|deposit)|locks? your seat", "retired seat-deposit offer"),
    (r"(?i)\bnight class|\bevening class|\bevenings?\b|\bnights?\b|saturday class|weekend class",
     "night, evening or weekend classes (Premier teaches daytime only)"),
    (r"(?i)job placement|placement (rate|assistance|guarantee)|\bsalar(y|ies)\b|\bguarantee|\bjob-ready\b"
     r"|\bhired\b|\bpaycheck", "job, placement, pay or guarantee claim"),
    (r"\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2}\b", "abbreviated date (write the month out)"),
    (r"\b\d{1,2}/\d{1,2}(/\d{2,4})?\b", "numeric date (write the month out)"),
    (r"(?i)partner offices?|hiring partners?", "partner-office claim"),
    (r"(?i)\bnumber one\b|#1\b|\blowest\b|\bcheapest\b|\bonly (rda|dental|school|program)",
     "superlative claim"),
    (r"\b406\b|85%|70%", "unapproved statistic"),
    (r"(?i)230-6444|241-8006|mccann|premierdentalacademy\.net", "retired contact detail"),
    (r"(?i)https?://premierdentalacademyoflongview", "link without www"),
    (r"(?i)\bcertified rda\b|walk out (certified|licensed)", "certificate/licence conflation"),
]
WARN = [
    (r"(?i)\bRDA\b|registered dental assistant|licens", "mentions RDA registration or licensing: keep it distinct from the school certificate"),
    (r"(?i)\bbest\b|\bonly\b|\bevery\b|\bmost\b", "check for an unintended superlative"),
]


def check_text(text: str, header: dict, post_date: str | None = None) -> tuple[list, list]:
    """Return (errors, warnings) for one post. Errors hold the post back."""
    errs: list = []
    warns: list = []
    if not isinstance(text, str) or not text.strip():
        return ["empty text"], []
    if len(text) > 3000:
        errs.append(f"too long ({len(text)} characters)")
    if text != text.strip() or "  " in text or re.search(r" \n|\n{3,}", text):
        errs.append("stray spaces or blank lines")
    body = re.sub(r"https?://\S+", "", text)
    for pat, why in BANNED:
        target = text if "https?" in pat else body
        if re.search(pat, target):
            errs.append(why)
    allowed_money = set(header.get("allowed_money") or DEFAULT_ALLOWED_MONEY)
    for m in re.finditer(r"\$\d{1,3}(?:,\d{3})*(?:\.\d\d)?(?!\d)", text):
        if m.group(0) not in allowed_money:
            errs.append(f"price {m.group(0)} is not on the approved list")
    if re.search(r"\$500\b", text) and "$3,500" not in text:
        errs.append("$500 down payment mentioned without the $3,500 plan total")
    for m in re.finditer(r"\(?\b\d{3}\)?[\s.-]?\d{3}-\d{4}\b", text):
        if m.group(0) != PHONE:
            errs.append(f"phone number {m.group(0)} (only {PHONE} is approved)")
    for m in re.finditer(r"https?://\S+", text):
        if not m.group(0).startswith(SITE):
            errs.append(f"link {m.group(0)} is not on {SITE}")
    allowed_dates = set(header.get("allowed_dates") or [])
    for m in re.finditer(rf"\b({MONTHS})\s+(\d{{1,2}})\b", text):
        if m.group(0) not in allowed_dates:
            errs.append(f"date '{m.group(0)}' is not on the approved list for this queue")
    year = int((post_date or "2026-01-01")[:4])
    for m in re.finditer(rf"\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+({MONTHS})\s+(\d{{1,2}})\b", text):
        month = dt.datetime.strptime(m.group(2), "%B").month
        yr = year + (1 if post_date and month < int(post_date[5:7]) else 0)
        try:
            real = dt.date(yr, month, int(m.group(3))).strftime("%A")
        except ValueError:
            errs.append(f"impossible date '{m.group(0)}'")
            continue
        if real != m.group(1):
            errs.append(f"'{m.group(0)}' is really a {real}")
    for m in re.finditer(r"\b\d{1,2}:\d{2}\s?(AM|PM|am|pm)\b", text):
        t = m.group(0).upper().replace("AM", " AM").replace("PM", " PM").replace("  ", " ")
        if t not in APPROVED_CLASS_TIMES:
            errs.append(f"time '{m.group(0)}' is not an approved class time")
    for pat, why in WARN:
        if re.search(pat, body):
            warns.append(why)
    return errs, warns


def link_of(text: str) -> str | None:
    urls = re.findall(r"https?://\S+", text)
    return urls[-1] if urls else None


def norm(s: str) -> str:
    s = re.sub(r"[\U0001F000-\U0001FFFF☀-➿️]", "", s or "")
    return re.sub(r"\s+", " ", s).strip().lower()


def sha(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


# ------------------------------------------------------------------- queue


class QueueError(Exception):
    pass


def read_queue_file(path: str) -> dict:
    with open(path, encoding="utf-8") as fh:
        q = json.load(fh)
    if not isinstance(q, dict) or q.get("format") != QUEUE_FORMAT:
        raise QueueError(f"{os.path.basename(path)}: not a {QUEUE_FORMAT} file")
    if q.get("approved") is not True:
        raise QueueError(f"{os.path.basename(path)}: not marked approved")
    if not isinstance(q.get("posts"), list):
        raise QueueError(f"{os.path.basename(path)}: no posts list")
    return q


def validate_queue(q: dict, page_id: str) -> tuple[list, list, list]:
    """Return (good_posts, problems, warnings). Each good post gets key/slot fields."""
    good, problems, warnings = [], [], []
    if str(q.get("page_id", page_id)) != str(page_id):
        return [], [("*", f"queue is for page {q.get('page_id')}, not {page_id}")], []
    seen = set()
    images = q.get("images") or {}
    for i, p in enumerate(q["posts"]):
        try:
            date_s, time_s = p["date"], p["time"]
            dt.date.fromisoformat(date_s)
            if not re.fullmatch(r"\d{2}:\d{2}", time_s):
                raise ValueError("time must be HH:MM (24-hour, Central)")
            key = f"{date_s} {time_s}"
        except Exception as e:  # noqa: BLE001
            problems.append((f"post #{i + 1}", f"bad date/time: {e}"))
            continue
        if key in seen:
            problems.append((key, "two posts for the same time slot"))
            continue
        seen.add(key)
        errs, warns = check_text(p.get("text", ""), q, date_s)
        for name in p.get("images") or []:
            if name not in images:
                errs.append(f"image '{name}' is not described in the queue's images list")
        entry = {
            "key": key,
            "slot_ts": slot_ts(date_s, time_s),
            "text": p.get("text", ""),
            "images": list(p.get("images") or []),
            "errors": errs,
        }
        good.append(entry)
        if errs:
            problems.append((key, "; ".join(errs)))
        for w in warns:
            warnings.append((key, w))
    return good, problems, warnings


# ------------------------------------------------------------------ graph


class GraphError(Exception):
    def __init__(self, status: int, code, subcode, message: str, transient: bool):
        super().__init__(message)
        self.status, self.code, self.subcode, self.message, self.transient = status, code, subcode, message, transient

    @property
    def auth(self) -> bool:
        return self.code in (102, 190) or (self.code == 200 and "permission" in self.message.lower()) \
            or self.code in (10,) or self.status == 401

    def __str__(self) -> str:
        return f"Facebook said: {self.message} (HTTP {self.status}, code {self.code}/{self.subcode})"


def encode_multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    boundary = "----pdafb" + uuid.uuid4().hex
    out = bytearray()
    for k, v in fields.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n'.encode()
        out += str(v).encode("utf-8") + b"\r\n"
    for k, (filename, content, ctype) in files.items():
        out += (f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{filename}"\r\n'
                f"Content-Type: {ctype}\r\n\r\n").encode()
        out += content + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), "multipart/form-data; boundary=" + boundary


class Graph:
    def __init__(self, cfg: dict, token: str):
        self.base = cfg["graph"]
        self.page_id = cfg["page_id"]
        self.timeout = cfg["timeout"]
        self.token = token
        self.calls = 0

    def req(self, method: str, path: str, params: dict | None = None, data: dict | None = None,
            files: dict | None = None) -> dict:
        url = self.base + "/" + path.lstrip("/")
        if params:
            url += "?" + urllib.parse.urlencode(params)
        headers = {"Authorization": "Bearer " + self.token, "User-Agent": f"pda-fb-poster/{VERSION}"}
        body = None
        if files:
            body, ctype = encode_multipart(data or {}, files)
            headers["Content-Type"] = ctype
        elif data is not None:
            body = urllib.parse.urlencode(data).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        request = urllib.request.Request(url, data=body, method=method, headers=headers)
        self.calls += 1
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as r:
                raw = r.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                err = json.loads(raw).get("error", {})
            except Exception:  # noqa: BLE001
                err = {}
            code, sub = err.get("code"), err.get("error_subcode")
            msg = scrub(err.get("message") or f"HTTP {e.code}")
            transient = e.code >= 500 or e.code == 429 or code in (1, 2, 4, 17, 32, 341, 368, 613) \
                or err.get("is_transient") is True
            raise GraphError(e.code, code, sub, msg, transient) from None
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
            raise GraphError(0, None, None, "network problem: " + scrub(str(e)), True) from None

    # -- reads
    def page(self) -> dict:
        info = self.req("GET", self.page_id, {"fields": "id,name"})
        try:  # a user or system-user token can hand out the Page token; a Page token may refuse this field
            tok = self.req("GET", self.page_id, {"fields": "access_token"}).get("access_token")
            if tok:
                info["access_token"] = tok
        except GraphError as e:
            if e.transient:
                raise
        return info

    def scheduled(self) -> list:
        out, after = [], None
        for _ in range(30):
            params = {"fields": "id,message,scheduled_publish_time,full_picture", "limit": "100"}
            if after:
                params["after"] = after
            res = self.req("GET", f"{self.page_id}/scheduled_posts", params)
            out += res.get("data", [])
            after = ((res.get("paging") or {}).get("cursors") or {}).get("after")
            if not (res.get("paging") or {}).get("next") or not after:
                break
        return out

    def published_between(self, since: int, until: int) -> list:
        res = self.req("GET", f"{self.page_id}/published_posts",
                       {"fields": "id,message,created_time", "since": str(since), "until": str(until), "limit": "50"})
        return res.get("data", [])

    def post_state(self, post_id: str) -> dict:
        return self.req("GET", post_id, {"fields": "id,is_published,scheduled_publish_time,permalink_url"})

    def token_info(self) -> dict:
        return self.req("GET", "debug_token", {"input_token": self.token}).get("data", {})

    # -- writes
    def schedule_text(self, message: str, ts: int, link: str | None) -> str:
        data = {"message": message, "published": "false", "scheduled_publish_time": str(ts)}
        if link:
            data["link"] = link
        res = self.req("POST", f"{self.page_id}/feed", data=data)
        return res["id"]

    def schedule_photo(self, message: str, ts: int, filename: str, content: bytes, ctype: str) -> str:
        data = {"caption": message, "published": "false", "scheduled_publish_time": str(ts),
                "unpublished_content_type": "SCHEDULED"}
        res = self.req("POST", f"{self.page_id}/photos", data=data, files={"source": (filename, content, ctype)})
        return res.get("post_id") or res["id"]

    def delete(self, post_id: str) -> None:
        self.req("DELETE", post_id)


# ------------------------------------------------------------------ ledger

SCHEMA = """
CREATE TABLE IF NOT EXISTS posts(
  key TEXT PRIMARY KEY,
  slot_ts INTEGER NOT NULL,
  text TEXT NOT NULL,
  text_sha TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  source TEXT,
  state TEXT NOT NULL DEFAULT 'waiting',
  fb_id TEXT,
  image_used TEXT,
  old_fb_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL, key TEXT, event TEXT NOT NULL, detail TEXT
);
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
"""
# states: waiting (in queue, not yet inside the window), held (breaks a content rule),
# failed (last attempt errored; retried), scheduled (by this poster), on_schedule (was already on
# the Page's schedule), published, removed (taken off the schedule by a person; never re-added),
# missed (its time passed and it was never scheduled), not_published (scheduled but Facebook did
# not publish it).
OPEN_STATES = ("waiting", "failed", "held")
LIVE_STATES = ("scheduled", "on_schedule")


class Ledger:
    def __init__(self, path: str):
        self.db = sqlite3.connect(path, timeout=30)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)

    def event(self, key, event, detail="") -> None:
        self.db.execute("INSERT INTO events(at,key,event,detail) VALUES(?,?,?,?)",
                        (ct_stamp(), key, event, scrub(detail)[:2000]))

    def get(self, key):
        return self.db.execute("SELECT * FROM posts WHERE key=?", (key,)).fetchone()

    def all(self):
        return self.db.execute("SELECT * FROM posts ORDER BY slot_ts").fetchall()

    def set(self, key, **kw) -> None:
        kw["updated_at"] = ct_stamp()
        cols = ",".join(f"{k}=?" for k in kw)
        self.db.execute(f"UPDATE posts SET {cols} WHERE key=?", (*kw.values(), key))

    def meta(self, k, v=None):
        if v is None:
            r = self.db.execute("SELECT v FROM meta WHERE k=?", (k,)).fetchone()
            return r["v"] if r else None
        self.db.execute("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", (k, str(v)))

    def commit(self) -> None:
        self.db.commit()


# ------------------------------------------------------------------ helpers


def paths(cfg: dict) -> dict:
    d = cfg["data"]
    return {"ledger": os.path.join(d, "ledger.db"), "status": os.path.join(d, "status.json"),
            "paused": os.path.join(d, "PAUSED"), "lock": os.path.join(d, "run.lock"),
            "remote": os.path.join(d, "remote"), "cache": os.path.join(d, "image-cache")}


def ensure_dirs(cfg: dict) -> None:
    for p in (cfg["data"], cfg["queue_dir"], cfg["photos_dir"], paths(cfg)["remote"], paths(cfg)["cache"]):
        os.makedirs(p, exist_ok=True)


def read_token(cfg: dict) -> str | None:
    try:
        with open(cfg["token_file"], encoding="utf-8") as fh:
            tok = fh.read().strip()
    except (FileNotFoundError, PermissionError):
        return None
    if tok.startswith("FB_TOKEN="):
        tok = tok.split("=", 1)[1].strip()
    return tok or None


def fetch(url: str, timeout: float, limit: int = 12_000_000) -> bytes:
    if not url.startswith("https://") and not (os.environ.get("PDAFB_TEST") and url.startswith("http://127.0.0.1")):
        raise ValueError("only https links are allowed")
    req = urllib.request.Request(url, headers={"User-Agent": f"pda-fb-poster/{VERSION}"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read(limit + 1)
    if len(data) > limit:
        raise ValueError("file is too large")
    return data


def sync_remote(cfg: dict) -> list:
    """Download remote queue files; keep the last good copy if a download fails."""
    notes = []
    for url in cfg["remote_queues"]:
        dest = os.path.join(paths(cfg)["remote"], hashlib.sha1(url.encode()).hexdigest()[:12] + ".json")
        try:
            raw = fetch(url, cfg["timeout"], 5_000_000)
            q = json.loads(raw.decode("utf-8"))
            if q.get("format") != QUEUE_FORMAT:
                raise QueueError("not a queue file")
            tmp = dest + ".tmp"
            with open(tmp, "wb") as fh:
                fh.write(raw)
            os.replace(tmp, dest)
        except Exception as e:  # noqa: BLE001
            notes.append(f"remote queue not refreshed ({type(e).__name__}: {scrub(str(e))[:120]}); using last copy")
    return notes


def queue_files(cfg: dict) -> list:
    files = sorted(glob.glob(os.path.join(cfg["queue_dir"], "*.json")))
    files += sorted(glob.glob(os.path.join(paths(cfg)["remote"], "*.json")))
    return files


def load_queues(cfg: dict) -> tuple[dict, dict, list]:
    """Merge every approved queue file. Later 'issued_at' wins for the same slot."""
    merged: dict = {}
    images: dict = {}
    notes: list = []
    loaded = []
    for f in queue_files(cfg):
        try:
            q = read_queue_file(f)
        except (QueueError, ValueError, OSError) as e:
            notes.append(str(e))
            continue
        loaded.append((str(q.get("issued_at", "")), f, q))
    for _, f, q in sorted(loaded, key=lambda x: (x[0], x[1])):
        posts, problems, _warn = validate_queue(q, cfg["page_id"])
        for key, why in problems:
            if key == "*":
                notes.append(f"{os.path.basename(f)}: {why}")
        for name, meta in (q.get("images") or {}).items():
            images[name] = meta
        for p in posts:
            p["source"] = os.path.basename(f)
            merged[p["key"]] = p
    return merged, images, notes


def image_for(cfg: dict, names: list, images: dict) -> tuple[str, str, bytes, str] | None:
    """First usable image in preference order: (name, filename, bytes, content-type)."""
    for name in names:
        meta = images.get(name) or {}
        if meta.get("people") and not meta.get("consent"):
            continue  # never post a photo of people without recorded consent
        candidates = [os.path.join(cfg["photos_dir"], name + ext) for ext in (".jpg", ".jpeg", ".png")]
        if meta.get("file"):
            candidates.insert(0, os.path.join(cfg["photos_dir"], os.path.basename(meta["file"])))
        content = None
        for c in candidates:
            if os.path.isfile(c):
                with open(c, "rb") as fh:
                    content = fh.read()
                break
        if content is None and meta.get("url"):
            cache = os.path.join(paths(cfg)["cache"], name)
            miss = cache + ".miss"
            if os.path.isfile(cache):
                with open(cache, "rb") as fh:
                    content = fh.read()
            elif not (os.path.isfile(miss) and time.time() - os.path.getmtime(miss) < 1800):
                try:
                    content = fetch(meta["url"], cfg["timeout"])
                    with open(cache, "wb") as fh:
                        fh.write(content)
                except Exception:  # noqa: BLE001
                    content = None
                    with open(miss, "w") as fh:  # not there yet: try again in 30 minutes
                        fh.write(ct_stamp())
        if not content:
            continue
        if meta.get("sha256") and hashlib.sha256(content).hexdigest() != meta["sha256"]:
            continue
        if content[:3] == b"\xff\xd8\xff":
            return name, name + ".jpg", content, "image/jpeg"
        if content[:8] == b"\x89PNG\r\n\x1a\n":
            return name, name + ".png", content, "image/png"
    return None


def waiting_for_photo(cfg: dict, names: list, images: dict, ts: int, now: int, fallback_ok: bool = True) -> str | None:
    """If the first-choice image is an allowed photo marked wait_days that is not here yet, and the post is
    still more than wait_days away, return a note saying so (the post is held back for now). Without
    fallback_ok (the Page's schedule listing has not been shown to include Business Suite posts, so a
    photo post loaded there would be invisible to us) it keeps waiting rather than risk a duplicate."""
    if not names:
        return None
    meta = images.get(names[0]) or {}
    days = float(meta.get("wait_days") or 0)
    if not days or (meta.get("people") and not meta.get("consent")):
        return None
    if image_for(cfg, names[:1], images):
        return None
    if not fallback_ok:
        return f"waiting for its photo ({names[0]}); it is loaded with the photo in Business Suite"
    if ts - now <= days * 86400:
        return None
    until = ct_label(ts - int(days * 86400))
    return f"waiting for its photo ({names[0]}); if the photo is not here by {until}, it goes out as text"


def drop_privileges(cfg: dict) -> None:
    if os.geteuid() != 0:
        return
    try:
        pw = pwd.getpwnam(cfg["user"])
    except KeyError:
        return
    os.setgroups([])
    os.setgid(pw.pw_gid)
    os.setuid(pw.pw_uid)


# ------------------------------------------------------------------- run


class RunStop(Exception):
    pass


def do_run(cfg: dict, dry: bool = False) -> dict:
    ensure_dirs(cfg)
    P = paths(cfg)
    summary = {"scheduled": [], "adopted": [], "held": [], "failed": [], "published": [], "missed": [],
               "removed": [], "upgraded": [], "notes": [], "dry_run": dry}
    with open(P["lock"], "w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            summary["notes"].append("another run is in progress")
            return summary
        led = Ledger(P["ledger"])
        try:
            return _run_locked(cfg, dry, summary, led)
        finally:
            led.db.close()


def _run_locked(cfg: dict, dry: bool, summary: dict, led: "Ledger") -> dict:
    P = paths(cfg)
    now = now_ts(cfg)
    summary["notes"] += sync_remote(cfg) if cfg["remote_queues"] else []
    queue, images, notes = load_queues(cfg)
    summary["notes"] += notes

    # 1. merge the queue into the ledger
    for key, p in queue.items():
        row = led.get(key)
        state = "held" if p["errors"] else "waiting"
        note = "; ".join(p["errors"]) if p["errors"] else None
        if row is None:
            led.db.execute("INSERT INTO posts(key,slot_ts,text,text_sha,images,source,state,note,updated_at) "
                           "VALUES(?,?,?,?,?,?,?,?,?)",
                           (key, p["slot_ts"], p["text"], sha(p["text"]), json.dumps(p["images"]), p["source"],
                            state, note, ct_stamp()))
            led.event(key, "queued", p["source"])
        elif row["state"] in OPEN_STATES + ("cancelled",):
            if row["text_sha"] != sha(p["text"]) or row["images"] != json.dumps(p["images"]) \
                    or (row["state"] == "held") != bool(p["errors"]) or row["state"] == "cancelled":
                if not p["errors"] and row["state"] == "failed":
                    state = "failed"  # keep its retry history
                led.set(key, text=p["text"], text_sha=sha(p["text"]), images=json.dumps(p["images"]),
                        source=p["source"], state=state, note=note)
                led.event(key, "queue_updated", p["source"])
        elif row["text_sha"] != sha(p["text"]) and led.meta(f"warned:{key}:{sha(p['text'])}") is None:
            led.event(key, "queue_changed_after_scheduling",
                      "the queue text changed after this post was scheduled; edit it in Business Suite if needed")
            led.meta(f"warned:{key}:{sha(p['text'])}", "1")
    # posts removed from the queue before they were scheduled are dropped
    for row in led.all():
        if row["key"] not in queue and row["state"] in ("waiting", "held", "failed"):
            led.set(row["key"], state="cancelled", note="no longer in any queue file")
            led.event(row["key"], "cancelled")
    led.commit()

    if os.path.exists(P["paused"]):
        summary["notes"].append("PAUSED: nothing was scheduled (run 'pda-fb-poster resume' to restart)")
        write_status(cfg, led, "paused", summary)
        return summary
    token = read_token(cfg)
    if not token:
        summary["notes"].append("waiting for a Facebook token (run 'sudo pda-fb-poster set-token')")
        write_status(cfg, led, "no_token", summary)
        return summary

    g = Graph(cfg, token)
    try:
        info = g.page()
        if str(info.get("id")) != str(cfg["page_id"]):
            raise RunStop(f"the token opened page {info.get('id')}, not {cfg['page_id']}")
        if info.get("access_token"):
            g.token = info["access_token"]  # a user or system-user token: use the Page token it grants
        summary["page_name"] = info.get("name")
        sched_raw = g.scheduled()
    except GraphError as e:
        led.meta("last_error", str(e))
        led.commit()
        summary["notes"].append(str(e))
        write_status(cfg, led, "token_problem" if e.auth else "facebook_unreachable", summary)
        return summary
    except RunStop as e:
        summary["notes"].append(str(e))
        write_status(cfg, led, "wrong_page", summary)
        return summary

    on_sched: dict = {}
    for s in sched_raw:
        ts = parse_fb_time(s.get("scheduled_publish_time"))
        if ts:
            on_sched.setdefault(ts, []).append(s)

    def at_slot(ts: int) -> list:
        return [x for t, lst in on_sched.items() if abs(t - ts) <= 90 for x in lst]

    for ts, lst in on_sched.items():
        if len(lst) > 1:
            summary["notes"].append(f"{ct_label(ts)} has {len(lst)} posts on the schedule (possible duplicate)")

    # 2. Business Suite horizon guard: only fill slots before start_after once the listing is proven to
    #    show Business Suite posts (it contains at least one queue slot from that earlier range).
    start_after = parse_fb_time(cfg["start_after"]) if cfg["start_after"] else None
    rows = led.all()
    proof = start_after is None or any(at_slot(r["slot_ts"]) for r in rows if r["slot_ts"] <= start_after)
    # has the listing ever shown a post we did not create (for example one loaded in Business Suite)?
    bs_visible = any(r["state"] == "on_schedule" for r in rows) or (
        start_after is not None and any(at_slot(r["slot_ts"]) for r in rows if r["slot_ts"] <= start_after))
    lead = int(cfg["min_lead_min"] * 60)
    if not proof and any(r["state"] in OPEN_STATES and now + lead <= r["slot_ts"] <= start_after for r in rows):
        summary["notes"].append(f"leaving slots up to {ct_label(start_after)} to Business Suite "
                                "(the Page's schedule listing does not show them yet)")

    horizon = now + int(cfg["window_days"] * 86400)
    created = 0
    for row in rows:
        key, ts, state = row["key"], row["slot_ts"], row["state"]
        found = at_slot(ts)

        if state in OPEN_STATES:
            if found:
                led.set(key, state="on_schedule", fb_id=found[0]["id"],
                        image_used="(already attached)" if found[0].get("full_picture") else None,
                        note="already on the Page's schedule")
                led.event(key, "adopted", found[0]["id"])
                summary["adopted"].append(key)
                continue
            if ts < now + lead:
                # its time has passed (or is too close to schedule): was it posted some other way?
                try:
                    pubs = g.published_between(ts - 3 * 3600, ts + 3 * 3600)
                except GraphError:
                    pubs = []
                head = norm(row["text"])[:60]
                match = [x for x in pubs if norm(x.get("message", ""))[:60] == head]
                if match:
                    led.set(key, state="published", fb_id=match[0]["id"], note="published outside the poster")
                    summary["published"].append(key)
                elif ts < now:
                    led.set(key, state="missed", note="its time passed before it could be scheduled")
                    led.event(key, "missed")
                    summary["missed"].append(key)
                continue
            if ts > horizon or state == "held":
                continue
            if start_after is not None and ts <= start_after and not proof:
                continue
            if created >= cfg["max_per_run"]:
                continue
            wait_note = waiting_for_photo(cfg, json.loads(row["images"]), images, ts, now, bs_visible)
            if wait_note:
                if row["note"] != wait_note:
                    led.set(key, note=wait_note)
                continue
            img = image_for(cfg, json.loads(row["images"]), images)
            if dry:
                summary["scheduled"].append(f"{key} (would schedule{' with image ' + img[0] if img else ''})")
                continue
            try:
                if img:
                    fb_id = g.schedule_photo(row["text"], ts, img[1], img[2], img[3])
                else:
                    fb_id = g.schedule_text(row["text"], ts, link_of(row["text"]))
            except GraphError as e:
                led.set(key, state="failed", attempts=row["attempts"] + 1, note=str(e)[:500])
                led.event(key, "schedule_failed", str(e))
                summary["failed"].append(f"{key}: {e}")
                led.commit()
                if e.auth:
                    summary["notes"].append("stopped: the token cannot post (" + e.message + ")")
                    write_status(cfg, led, "token_problem", summary)
                    return summary
                continue
            created += 1
            led.set(key, state="scheduled", fb_id=fb_id, image_used=img[0] if img else None,
                    attempts=row["attempts"] + 1, note=None)
            led.event(key, "scheduled", f"{fb_id} {'image ' + img[0] if img else 'text'}")
            led.commit()
            summary["scheduled"].append(key + (f" (image {img[0]})" if img else ""))
            log(f"scheduled {ct_label(ts)} ({'image ' + img[0] if img else 'text'}) id={fb_id}")
            continue

        if state in LIVE_STATES:
            if ts > now + 300 and not found:
                # no longer on the schedule: published early, or taken off by a person
                try:
                    st = g.post_state(row["fb_id"])
                    if st.get("is_published"):
                        led.set(key, state="published", note="published")
                        summary["published"].append(key)
                    elif parse_fb_time(st.get("scheduled_publish_time")):
                        pass  # still scheduled (listing lag)
                    else:
                        led.set(key, state="removed", note="taken off the schedule; will not be re-added")
                        led.event(key, "removed_by_person")
                        summary["removed"].append(key)
                except GraphError as e:
                    if not e.transient:
                        led.set(key, state="removed", note="taken off the schedule; will not be re-added")
                        led.event(key, "removed_by_person", str(e))
                        summary["removed"].append(key)
                continue
            if ts < now - 20 * 60:
                try:
                    st = g.post_state(row["fb_id"])
                except GraphError as e:
                    if not e.transient:
                        led.set(key, state="not_published", note=str(e)[:300])
                        summary["failed"].append(f"{key}: {e}")
                    continue
                if st.get("is_published"):
                    led.set(key, state="published", note=st.get("permalink_url"))
                    summary["published"].append(key)
                elif ts < now - 3 * 3600:
                    led.set(key, state="not_published", note="Facebook has not published it")
                    led.event(key, "not_published")
                    summary["failed"].append(f"{key}: not published by Facebook")
                continue
            # image arrived after the post was scheduled as text: swap it for the photo version
            if (cfg["upgrade_images"] and not dry and ts > now + 2 * 3600 and not row["image_used"]
                    and json.loads(row["images"]) and found
                    and norm(found[0].get("message", ""))[:80] == norm(row["text"])[:80]
                    and not found[0].get("full_picture")):
                img = image_for(cfg, json.loads(row["images"]), images)
                if img:
                    try:
                        new_id = g.schedule_photo(row["text"], ts, img[1], img[2], img[3])
                    except GraphError as e:
                        led.event(key, "upgrade_failed", str(e))
                        continue
                    led.set(key, fb_id=new_id, image_used=img[0], old_fb_id=row["fb_id"], state="scheduled")
                    led.event(key, "upgraded_with_image", f"{row['fb_id']} -> {new_id} ({img[0]})")
                    led.commit()
                    try:
                        g.delete(row["fb_id"])
                        led.set(key, old_fb_id=None)
                    except GraphError as e:
                        led.event(key, "old_post_delete_failed", str(e))
                    summary["upgraded"].append(f"{key} ({img[0]})")
                    log(f"added image {img[0]} to {ct_label(ts)}")
            if row["old_fb_id"] and not dry:
                try:
                    g.delete(row["old_fb_id"])
                    led.set(key, old_fb_id=None)
                    led.event(key, "old_post_deleted", row["old_fb_id"])
                except GraphError:
                    pass
    led.meta("last_ok_run", ct_stamp())
    led.meta("last_error", "")
    led.commit()
    write_status(cfg, led, "ok", summary)
    return summary


# ------------------------------------------------------------------ status


def write_status(cfg: dict, led: Ledger, health: str, summary: dict) -> dict:
    rows = led.all()
    now = now_ts(cfg)
    counts: dict = {}
    for r in rows:
        counts[r["state"]] = counts.get(r["state"], 0) + 1
    upcoming = [{"when": ct_label(r["slot_ts"]), "key": r["key"], "state": r["state"],
                 "image": r["image_used"]} for r in rows if now <= r["slot_ts"] <= now + 7 * 86400]
    problems = [{"when": ct_label(r["slot_ts"]), "key": r["key"], "state": r["state"], "why": r["note"]}
                for r in rows if r["state"] in ("held", "failed", "missed", "not_published")
                and r["slot_ts"] >= now - 14 * 86400]
    last = max((r["slot_ts"] for r in rows if r["state"] not in ("cancelled",)), default=None)
    status = {
        "updated": ct_stamp(), "version": VERSION, "health": health,
        "page": summary.get("page_name") or cfg["page_name"],
        "counts": counts, "queue_runs_through": ct_label(last) if last else None,
        "days_of_posts_left": round((last - now) / 86400, 1) if last else 0,
        "this_run": {k: v for k, v in summary.items() if v}, "next_7_days": upcoming, "problems": problems,
        "last_ok_run": led.meta("last_ok_run"),
    }
    path = paths(cfg)["status"]
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(status, fh, indent=1)
    os.replace(tmp, path)
    return status


HEALTH_TEXT = {
    "ok": "working",
    "paused": "PAUSED (nothing is being scheduled)",
    "no_token": "WAITING FOR A FACEBOOK TOKEN (run: sudo pda-fb-poster set-token)",
    "token_problem": "TOKEN PROBLEM (the token expired or cannot post; run: sudo pda-fb-poster set-token)",
    "facebook_unreachable": "could not reach Facebook on the last run (will retry)",
    "wrong_page": "TOKEN IS FOR A DIFFERENT PAGE",
}


def cmd_status(cfg: dict, args) -> int:
    path = paths(cfg)["status"]
    if not os.path.exists(path):
        print("No status yet: the poster has not run. Try: sudo pda-fb-poster run")
        return 1
    with open(path, encoding="utf-8") as fh:
        s = json.load(fh)
    print(f"Facebook poster for {s['page']}: {HEALTH_TEXT.get(s['health'], s['health'])}")
    print(f"Last update {s['updated']}; last good run {s.get('last_ok_run') or 'never'}")
    c = s.get("counts", {})
    print("Posts: " + ", ".join(f"{v} {k.replace('_', ' ')}" for k, v in sorted(c.items())))
    print(f"The queue runs through {s.get('queue_runs_through')} ({s.get('days_of_posts_left')} days from now)")
    if s.get("problems"):
        print("\nNeeds attention:")
        for p in s["problems"]:
            print(f"  {p['when']}: {p['state']} - {p['why']}")
    print("\nNext 7 days:")
    for u in s.get("next_7_days", []):
        print(f"  {u['when']:<24} {u['state']}{' + image ' + u['image'] if u.get('image') else ''}")
    for n in (s.get("this_run") or {}).get("notes", []):
        print("Note: " + n)
    return 0


# ---------------------------------------------------------------- commands


def cmd_run(cfg: dict, args) -> int:
    drop_privileges(cfg)
    s = do_run(cfg, dry=args.dry_run)
    parts = [f"{k}={len(v)}" for k, v in s.items() if isinstance(v, list) and v and k != "notes"]
    log(("DRY RUN " if args.dry_run else "") + "run done: " + (", ".join(parts) or "nothing to do"))
    for n in s["notes"]:
        log("note: " + n)
    if args.dry_run:
        for x in s["scheduled"]:
            print("  " + x)
    return 0


def verify_token(cfg: dict, token: str) -> tuple[bool, list]:
    lines, ok = [], True
    g = Graph(cfg, token)
    try:
        info = g.page()
    except GraphError as e:
        return False, [f"Could not open the Page with this token. {e}"]
    if str(info.get("id")) != str(cfg["page_id"]):
        return False, [f"This token opens page {info.get('id')} ({info.get('name')}), not {cfg['page_name']}."]
    lines.append(f"Page: {info.get('name')} ({info.get('id')})")
    if info.get("access_token"):
        lines.append("Token type: user or system-user token (the poster will use the Page token it grants)")
        g.token = info["access_token"]
    try:
        d = g.token_info()
        scopes = d.get("scopes") or []
        exp = d.get("expires_at")
        lines.append("Token expires: " + ("never" if not exp else ct_stamp(int(exp))))
        lines.append("Permissions: " + (", ".join(scopes) or "(not listed)"))
        if scopes and "pages_manage_posts" not in scopes:
            ok = False
            lines.append("MISSING pages_manage_posts: this token cannot schedule posts.")
    except GraphError as e:
        lines.append(f"(Facebook would not list the token's permissions: {e.message})")
    try:
        n = len(g.scheduled())
        lines.append(f"Can read the Page's schedule: yes ({n} posts scheduled right now)")
    except GraphError as e:
        ok = False
        lines.append(f"Cannot read the Page's schedule: {e}")
    return ok, lines


def cmd_set_token(cfg: dict, args) -> int:
    if os.geteuid() != 0 and not os.environ.get("PDAFB_TEST"):
        print("Run this with sudo: sudo pda-fb-poster set-token")
        return 1
    if args.from_env:
        env_file, var = args.from_env
        token = None
        with open(env_file, encoding="utf-8") as fh:
            for line in fh:
                if line.strip().startswith(var + "="):
                    token = line.split("=", 1)[1].strip().strip('"').strip("'")
        if not token:
            print(f"{var} was not found in {env_file}.")
            return 1
    else:
        token = getpass.getpass("Paste the Facebook token and press Enter (it will not show on screen): ").strip()
    if len(token) < 40 or " " in token:
        print("That does not look like a Facebook token. Nothing was saved.")
        return 1
    ok, lines = verify_token(cfg, token)
    for line in lines:
        print(scrub(line))
    if not ok and not args.force:
        print("Nothing was saved. Fix the token (see the README), then run this again.")
        return 1
    os.makedirs(os.path.dirname(cfg["token_file"]), exist_ok=True)
    tmp = cfg["token_file"] + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o640)
    with os.fdopen(fd, "w") as fh:
        fh.write(token + "\n")
    try:
        gid = pwd.getpwnam(cfg["user"]).pw_gid
        os.chown(tmp, 0, gid)
    except (KeyError, PermissionError):
        pass
    os.replace(tmp, cfg["token_file"])
    print("Saved. The poster will use it on its next run (within 15 minutes).")
    return 0


def cmd_check(cfg: dict, args) -> int:
    token = read_token(cfg)
    if not token:
        print("No token saved yet. Run: sudo pda-fb-poster set-token")
        return 1
    ok, lines = verify_token(cfg, token)
    for line in lines:
        print(scrub(line))
    print("Result: " + ("ready to post" if ok else "NOT ready"))
    return 0 if ok else 1


def cmd_validate(cfg: dict, args) -> int:
    rc = 0
    for f in args.files:
        try:
            q = read_queue_file(f)
        except (QueueError, ValueError, OSError) as e:
            print(f"{f}: {e}")
            rc = 1
            continue
        posts, problems, warns = validate_queue(q, cfg["page_id"])
        print(f"{f}: {len(posts)} posts, {len(problems)} problems, {len(warns)} warnings")
        for key, why in problems:
            print(f"  PROBLEM {key}: {why}")
            rc = 1
        if args.verbose:
            for key, why in warns:
                print(f"  check   {key}: {why}")
    return rc


def cmd_import(cfg: dict, args) -> int:
    rc = cmd_validate(cfg, argparse.Namespace(files=[args.file], verbose=False))
    if rc and not args.force:
        print("Not imported. Fix the problems above (or use --force to import and hold the bad posts).")
        return rc
    with open(args.file, "rb") as fh:
        content = fh.read()
    drop_privileges(cfg)
    ensure_dirs(cfg)
    dest = os.path.join(cfg["queue_dir"], os.path.basename(args.file))
    with open(dest, "wb") as fh:
        fh.write(content)
    print(f"Imported to {dest}. It is picked up on the next run.")
    return 0


def cmd_pause(cfg: dict, args) -> int:
    drop_privileges(cfg)
    ensure_dirs(cfg)
    with open(paths(cfg)["paused"], "w") as fh:
        fh.write(ct_stamp() + "\n")
    print("Paused. Nothing new will be scheduled until: sudo pda-fb-poster resume")
    print("(Posts already on the Facebook schedule still go out; remove them in Business Suite if needed.)")
    return 0


def cmd_resume(cfg: dict, args) -> int:
    drop_privileges(cfg)
    try:
        os.remove(paths(cfg)["paused"])
    except FileNotFoundError:
        pass
    print("Resumed. The next run (within 15 minutes) picks up where it left off.")
    return 0


def cmd_requeue(cfg: dict, args) -> int:
    drop_privileges(cfg)
    led = Ledger(paths(cfg)["ledger"])
    row = led.get(args.key)
    if not row:
        print(f"No post with key {args.key!r} (format: 'YYYY-MM-DD HH:MM').")
        return 1
    led.set(args.key, state="waiting", fb_id=None, image_used=None, note="requeued by hand")
    led.event(args.key, "requeued")
    led.commit()
    print(f"{args.key} will be scheduled again on the next run if it is still in the future.")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="pda-fb-poster", description=__doc__.split("\n\n")[0])
    ap.add_argument("--version", action="version", version=VERSION)
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--dry-run", action="store_true")
    sub.add_parser("status")
    t = sub.add_parser("set-token")
    t.add_argument("--from-env", nargs=2, metavar=("ENV_FILE", "VARIABLE"))
    t.add_argument("--force", action="store_true")
    sub.add_parser("check")
    v = sub.add_parser("validate")
    v.add_argument("files", nargs="+")
    v.add_argument("-v", "--verbose", action="store_true")
    i = sub.add_parser("import")
    i.add_argument("file")
    i.add_argument("--force", action="store_true")
    sub.add_parser("pause")
    sub.add_parser("resume")
    q = sub.add_parser("requeue")
    q.add_argument("key")
    args = ap.parse_args(argv)
    cfg = load_config()
    return {"run": cmd_run, "status": cmd_status, "set-token": cmd_set_token, "check": cmd_check,
            "validate": cmd_validate, "import": cmd_import, "pause": cmd_pause, "resume": cmd_resume,
            "requeue": cmd_requeue}[args.cmd](cfg, args)


if __name__ == "__main__":
    sys.exit(main())
