"""Tests for pda_fb_poster against a fake Graph API (no network, no real Facebook).

Run: python3 -m unittest discover -s ops/fb-poster/tests -v
"""
import contextlib
import datetime as dt
import email.parser
import io
import json
import os
import shutil
import sys
import tempfile
import threading
import unittest
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)
import pda_fb_poster as P  # noqa: E402

PAGE = "180743142587539"
GOOD = "EAAtestTOKEN" + "x" * 60          # looks like a real token so the scrubber is exercised
REAL_QUEUE = os.path.join(ROOT, "queue", "2026-10-24_to_2026-11-22.json")


def load_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


class FakeGraph:
    """Just enough of the Graph API for the poster: pages, scheduled_posts, feed, photos, posts."""

    def __init__(self):
        self.now = 0
        self.posts = {}          # id -> dict
        self.seq = 1000
        self.fail_next_create = None   # ("lost", ) create then 500, or ("error", code, status)
        self.token_ok = True
        self.page_token_mode = False   # True: token is a user token that hands out a page token
        self.calls = []
        self.lock = threading.Lock()

    def new_id(self):
        self.seq += 1
        return f"{PAGE}_{self.seq}"

    def add(self, ts, message, picture=None, published=False, by="business_suite"):
        pid = self.new_id()
        self.posts[pid] = {"id": pid, "message": message, "scheduled_publish_time": ts,
                           "is_published": published, "full_picture": picture, "by": by}
        return pid

    def at(self, ts):
        return [p for p in self.posts.values() if p["scheduled_publish_time"] == ts]


def make_handler(fake: FakeGraph):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, obj):
            body = json.dumps(obj).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _err(self, status, code, msg):
            self._send(status, {"error": {"message": msg, "type": "OAuthException", "code": code}})

        def _auth(self):
            h = self.headers.get("Authorization", "")
            if not fake.token_ok or h not in ("Bearer " + GOOD, "Bearer PAGE-" + GOOD):
                self._err(400, 190, "Error validating access token: Session has expired")
                return False
            return True

        def _route(self, method):
            u = urllib.parse.urlparse(self.path)
            parts = u.path.split("/")[2:]            # drop '' and 'v23.0'
            q = {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}
            n = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(n) if n else b""
            form = {}
            ctype = self.headers.get("Content-Type", "")
            if ctype.startswith("application/x-www-form-urlencoded"):
                form = {k: v[0] for k, v in urllib.parse.parse_qs(raw.decode()).items()}
            elif ctype.startswith("multipart/form-data"):
                msg = email.parser.BytesParser().parsebytes(b"Content-Type: " + ctype.encode() + b"\r\n\r\n" + raw)
                for part in msg.get_payload():
                    name = part.get_param("name", header="content-disposition")
                    payload = part.get_payload(decode=True)
                    form[name] = payload if part.get_filename() else payload.decode()
            with fake.lock:
                fake.calls.append((method, "/".join(parts), {k: (v if k != "source" else f"<{len(v)} bytes>")
                                                              for k, v in form.items()}))
            if not self._auth():
                return
            with fake.lock:
                return self._dispatch(method, parts, q, form)

        def _dispatch(self, method, parts, q, form):
            if parts == ["debug_token"]:
                return self._send(200, {"data": {"type": "PAGE", "expires_at": 0,
                                                 "scopes": ["pages_manage_posts", "pages_read_engagement",
                                                            "pages_show_list"]}})
            if parts == [PAGE] and method == "GET":
                if q.get("fields") == "access_token":
                    if fake.page_token_mode:
                        return self._send(200, {"access_token": "PAGE-" + GOOD, "id": PAGE})
                    return self._err(400, 100, "(#100) Tried accessing nonexisting field (access_token)")
                return self._send(200, {"id": PAGE, "name": "Premier Dental Academy of Longview"})
            if parts == [PAGE, "scheduled_posts"]:
                items = sorted((p for p in fake.posts.values() if not p["is_published"]),
                               key=lambda p: p["scheduled_publish_time"])
                start = int(q.get("after") or 0)
                page = items[start:start + 7]            # small pages to exercise paging
                res = {"data": [{"id": p["id"], "message": p["message"],
                                 "scheduled_publish_time": p["scheduled_publish_time"],
                                 **({"full_picture": p["full_picture"]} if p["full_picture"] else {})}
                                for p in page]}
                if start + 7 < len(items):
                    res["paging"] = {"cursors": {"after": str(start + 7)}, "next": "https://example/next"}
                return self._send(200, res)
            if parts == [PAGE, "published_posts"]:
                since, until = int(q["since"]), int(q["until"])
                data = [{"id": p["id"], "message": p["message"],
                         "created_time": dt.datetime.fromtimestamp(p["scheduled_publish_time"], dt.timezone.utc)
                         .strftime("%Y-%m-%dT%H:%M:%S+0000")}
                        for p in fake.posts.values() if p["is_published"]
                        and since <= p["scheduled_publish_time"] <= until]
                return self._send(200, {"data": data})
            if parts in ([PAGE, "feed"], [PAGE, "photos"]) and method == "POST":
                ts = int(form["scheduled_publish_time"])
                assert form["published"] == "false"
                if not (fake.now + 600 <= ts <= fake.now + 30 * 86400):
                    return self._err(400, 100, "(#100) The specified scheduled publish time is invalid.")
                if fake.fail_next_create:
                    kind = fake.fail_next_create
                    fake.fail_next_create = None
                    if kind[0] == "error":
                        return self._err(kind[2], kind[1], "Simulated failure")
                photo = parts[1] == "photos"
                message = form.get("caption") if photo else form.get("message")
                pid = fake.add(ts, message, picture="https://img/x.jpg" if photo else None, by="poster")
                fake.posts[pid]["link"] = form.get("link")
                fake.posts[pid]["bytes"] = len(form.get("source", b"")) if photo else 0
                if fake.fail_next_create is None and getattr(fake, "_lose", False):
                    fake._lose = False
                    return self._err(500, 2, "Service temporarily unavailable")
                return self._send(200, {"id": pid.split("_")[1], "post_id": pid} if photo else {"id": pid})
            if len(parts) == 1 and parts[0] in fake.posts:
                p = fake.posts[parts[0]]
                if method == "DELETE":
                    del fake.posts[parts[0]]
                    return self._send(200, {"success": True})
                return self._send(200, {"id": p["id"], "is_published": p["is_published"],
                                        **({} if p["is_published"] else
                                           {"scheduled_publish_time": p["scheduled_publish_time"]}),
                                        "permalink_url": "https://www.facebook.com/" + p["id"]})
            if len(parts) == 1 and "_" in parts[0]:
                return self._err(400, 100, "(#100) Object does not exist")
            return self._err(400, 100, "unknown route " + "/".join(parts))

        def do_GET(self):
            self._route("GET")

        def do_POST(self):
            self._route("POST")

        def do_DELETE(self):
            self._route("DELETE")

    return H


def iso(y, m, d, hh, mm):
    return dt.datetime(y, m, d, hh, mm, tzinfo=P.CT).isoformat()


class PosterTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fake = FakeGraph()
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(cls.fake))
        cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()

    def setUp(self):
        f = self.fake
        f.posts.clear()
        f.calls.clear()
        f.fail_next_create = None
        f._lose = False
        f.token_ok = True
        f.page_token_mode = False
        self.tmp = tempfile.mkdtemp()
        self.data = os.path.join(self.tmp, "data")
        os.makedirs(os.path.join(self.data, "queue"))
        shutil.copytree(os.path.join(ROOT, "photos"), os.path.join(self.data, "photos"))
        self.token_file = os.path.join(self.tmp, "token")
        with open(self.token_file, "w") as fh:
            fh.write(GOOD + "\n")
        self.env = {"PDAFB_CONFIG": "/nonexistent", "PDAFB_DATA": self.data,
                    "PDAFB_TOKEN_FILE": self.token_file, "PDAFB_GRAPH": f"http://127.0.0.1:{self.port}/v23.0",
                    "PDAFB_TIMEOUT": "10", "PDAFB_START_AFTER": "", "PDAFB_TEST": "1"}
        self.set_now(iso(2026, 9, 27, 16, 45))

    def tearDown(self):
        shutil.rmtree(self.tmp)
        for k in list(os.environ):
            if k.startswith("PDAFB_"):
                del os.environ[k]

    # helpers
    def set_now(self, iso_s):
        self.env["PDAFB_NOW"] = iso_s
        self.fake.now = int(dt.datetime.fromisoformat(iso_s).timestamp())

    def cfg(self, **extra):
        os.environ.update(self.env)
        os.environ.update({k: str(v) for k, v in extra.items()})
        return P.load_config()

    def use_real_queue(self):
        shutil.copy(REAL_QUEUE, os.path.join(self.data, "queue"))

    def write_queue(self, posts, **hdr):
        q = {"format": P.QUEUE_FORMAT, "page_id": PAGE, "issued_at": hdr.pop("issued_at", "2026-09-27T12:00:00-05:00"),
             "approved": hdr.pop("approved", True), "allowed_dates": ["November 9", "November 17"],
             "images": hdr.pop("images", {}), "posts": posts}
        q.update(hdr)
        path = os.path.join(self.data, "queue", hdr.get("name", "test.json"))
        with open(path, "w") as fh:
            json.dump(q, fh)
        return path

    def run_once(self, **extra):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            s = P.do_run(self.cfg(**extra))
        self.assertNotIn(GOOD, buf.getvalue())
        return s

    def states(self):
        led = P.Ledger(os.path.join(self.data, "ledger.db"))
        return {r["key"]: r["state"] for r in led.all()}

    def posts_at(self, key):
        d, t = key.split(" ")
        return self.fake.at(P.slot_ts(d, t))

    # ------------------------------------------------------------- tests
    def test_first_run_fills_the_29_5_day_window(self):
        self.use_real_queue()
        s = self.run_once()
        # now Sep 27 4:45 PM + 29.5 days = Oct 27 4:45 AM: Oct 24, 25, 26 are inside (15 posts)
        self.assertEqual(len(s["scheduled"]), 15, s)
        self.assertEqual(len(self.fake.posts), 15)
        photo = self.posts_at("2026-10-24 16:30")
        self.assertEqual(len(photo), 1)
        self.assertTrue(photo[0]["full_picture"])
        self.assertGreater(photo[0]["bytes"], 100_000)
        link = self.posts_at("2026-10-26 13:15")[0]
        self.assertEqual(link["link"],
                         "https://www.premierdentalacademyoflongview.com/blog/november-dental-assistant-classes-longview")
        st = self.states()
        self.assertEqual(st["2026-10-27 07:45"], "waiting")
        self.assertEqual(sum(1 for v in st.values() if v == "scheduled"), 15)

    def test_second_run_adds_nothing(self):
        self.use_real_queue()
        self.run_once()
        s = self.run_once()
        self.assertEqual(s["scheduled"], [])
        self.assertEqual(len(self.fake.posts), 15)

    def test_next_day_adds_only_the_new_day(self):
        self.use_real_queue()
        self.run_once()
        self.set_now(iso(2026, 9, 28, 16, 45))
        s = self.run_once()
        self.assertEqual(sorted(s["scheduled"]), ["2026-10-27 07:45", "2026-10-27 10:30", "2026-10-27 13:15",
                                                  "2026-10-27 16:30", "2026-10-27 19:15"])
        self.assertEqual(len(self.fake.posts), 20)

    def test_business_suite_posts_are_adopted_not_duplicated(self):
        self.use_real_queue()
        q = load_json(REAL_QUEUE)
        for p in q["posts"][:15]:
            self.fake.add(P.slot_ts(p["date"], p["time"]), p["text"])
        s = self.run_once()
        self.assertEqual(s["scheduled"], [])
        self.assertEqual(len(s["adopted"]), 15)
        self.assertEqual(len(self.fake.posts), 15)

    def test_start_after_guard_without_proof(self):
        self.use_real_queue()
        s = self.run_once(PDAFB_START_AFTER=iso(2026, 10, 26, 19, 15))
        self.assertEqual(s["scheduled"], [])
        self.assertTrue(any("Business Suite" in n for n in s["notes"]))
        self.set_now(iso(2026, 9, 28, 16, 45))
        s = self.run_once(PDAFB_START_AFTER=iso(2026, 10, 26, 19, 15))
        self.assertEqual(len(s["scheduled"]), 5)
        self.assertTrue(all(k.startswith("2026-10-27") for k in s["scheduled"]))

    def test_start_after_guard_with_proof_fills_gaps(self):
        self.use_real_queue()
        q = load_json(REAL_QUEUE)
        p0 = q["posts"][0]
        self.fake.add(P.slot_ts(p0["date"], p0["time"]), p0["text"])
        s = self.run_once(PDAFB_START_AFTER=iso(2026, 10, 26, 19, 15))
        self.assertEqual(len(s["adopted"]), 1)
        self.assertEqual(len(s["scheduled"]), 14)
        self.assertEqual(len(self.fake.posts), 15)

    def test_bad_post_is_held_not_posted(self):
        self.write_queue([
            {"date": "2026-10-10", "time": "07:45", "text": "Tuition is $1,997 — call (903) 230-6444 #dental"},
            {"date": "2026-10-10", "time": "10:30", "text": "A clean, approved post."},
        ])
        s = self.run_once()
        st = self.states()
        self.assertEqual(st["2026-10-10 07:45"], "held")
        self.assertEqual(st["2026-10-10 10:30"], "scheduled")
        self.assertEqual(len(self.fake.posts), 1)
        status = load_json(os.path.join(self.data, "status.json"))
        self.assertEqual(status["problems"][0]["state"], "held")
        self.assertIn("retired price", status["problems"][0]["why"])
        self.assertEqual(s["scheduled"], ["2026-10-10 10:30"])

    def test_unapproved_queue_is_ignored(self):
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "Hello."}], approved=False)
        s = self.run_once()
        self.assertEqual(self.fake.posts, {})
        self.assertTrue(any("not marked approved" in n for n in s["notes"]))

    def test_lost_response_does_not_duplicate(self):
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "One post only."}])
        self.fake._lose = True       # Facebook creates the post, but the reply is a 500
        s = self.run_once()
        self.assertEqual(len(s["failed"]), 1)
        self.assertEqual(self.states()["2026-10-10 07:45"], "failed")
        s = self.run_once()
        self.assertEqual(s["adopted"], ["2026-10-10 07:45"])
        self.assertEqual(len(self.fake.posts), 1)

    def test_transient_error_is_retried(self):
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "Retry me."}])
        self.fake.fail_next_create = ("error", 2, 500)
        self.run_once()
        self.assertEqual(self.fake.posts, {})
        s = self.run_once()
        self.assertEqual(s["scheduled"], ["2026-10-10 07:45"])
        self.assertEqual(len(self.fake.posts), 1)

    def test_expired_token_stops_cleanly(self):
        self.use_real_queue()
        self.fake.token_ok = False
        s = self.run_once()
        self.assertEqual(self.fake.posts, {})
        status = load_json(os.path.join(self.data, "status.json"))
        self.assertEqual(status["health"], "token_problem")
        self.assertNotIn(GOOD, json.dumps(status))
        self.assertTrue(s["notes"])

    def test_user_token_uses_the_page_token_it_grants(self):
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "Via page token."}])
        self.fake.page_token_mode = True
        self.run_once()
        self.assertEqual(len(self.fake.posts), 1)

    def test_post_removed_by_a_person_is_not_re_added(self):
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "Remove me by hand."}])
        self.run_once()
        pid = list(self.fake.posts)[0]
        del self.fake.posts[pid]
        s = self.run_once()
        self.assertEqual(s["removed"], ["2026-10-10 07:45"])
        s = self.run_once()
        self.assertEqual(s["scheduled"], [])
        self.assertEqual(self.fake.posts, {})

    def test_publication_is_verified(self):
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "Verify me."}])
        self.run_once()
        pid = list(self.fake.posts)[0]
        self.fake.posts[pid]["is_published"] = True
        self.set_now(iso(2026, 10, 10, 8, 30))
        s = self.run_once()
        self.assertEqual(s["published"], ["2026-10-10 07:45"])

    def test_missed_slot_is_reported(self):
        self.write_queue([{"date": "2026-09-27", "time": "07:45", "text": "Too late for this one."}])
        s = self.run_once()
        self.assertEqual(s["missed"], ["2026-09-27 07:45"])
        self.assertEqual(self.fake.posts, {})

    def test_image_arriving_later_replaces_the_text_version(self):
        self.write_queue([{"date": "2026-10-27", "time": "16:30", "text": "Four teeth, four jobs.",
                           "images": ["ai01"]}],
                         images={"ai01": {"kind": "ai_illustration", "file": None, "people": False}})
        self.set_now(iso(2026, 9, 28, 16, 45))
        self.run_once()
        self.assertEqual(len(self.fake.posts), 1)
        old = list(self.fake.posts)[0]
        self.assertFalse(self.fake.posts[old]["full_picture"])
        shutil.copy(os.path.join(ROOT, "photos", "tray_setup.jpg"), os.path.join(self.data, "photos", "ai01.jpg"))
        s = self.run_once()
        self.assertEqual(len(s["upgraded"]), 1)
        self.assertEqual(len(self.fake.posts), 1)
        new = list(self.fake.posts.values())[0]
        self.assertNotEqual(new["id"], old)
        self.assertTrue(new["full_picture"])

    def test_people_photo_needs_consent(self):
        img = {"student": {"kind": "photo", "file": "tray_setup.jpg", "people": True, "consent": False}}
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "Class photo.", "images": ["student"]}],
                         images=img)
        self.run_once()
        self.assertFalse(list(self.fake.posts.values())[0]["full_picture"])

    def test_pause_and_no_token(self):
        self.write_queue([{"date": "2026-10-10", "time": "07:45", "text": "Paused."}])
        open(os.path.join(self.data, "PAUSED"), "w").close()
        self.run_once()
        self.assertEqual(self.fake.posts, {})
        os.remove(os.path.join(self.data, "PAUSED"))
        os.remove(self.token_file)
        self.run_once()
        status = load_json(os.path.join(self.data, "status.json"))
        self.assertEqual(status["health"], "no_token")
        self.assertEqual(self.fake.posts, {})

    def test_newer_queue_file_wins_before_scheduling(self):
        self.write_queue([{"date": "2026-11-10", "time": "07:45", "text": "Old wording."}], name="a.json",
                         issued_at="2026-09-01T00:00:00-05:00")
        self.run_once()
        self.write_queue([{"date": "2026-11-10", "time": "07:45", "text": "New wording."}], name="b.json",
                         issued_at="2026-09-20T00:00:00-05:00")
        self.set_now(iso(2026, 10, 12, 9, 0))
        self.run_once()
        self.assertEqual([p["message"] for p in self.fake.posts.values()], ["New wording."])

    def test_dst_fall_back(self):
        self.assertEqual(P.slot_ts("2026-10-31", "07:45"),
                         int(dt.datetime(2026, 10, 31, 12, 45, tzinfo=dt.timezone.utc).timestamp()))
        self.assertEqual(P.slot_ts("2026-11-01", "07:45"),
                         int(dt.datetime(2026, 11, 1, 13, 45, tzinfo=dt.timezone.utc).timestamp()))

    def test_status_and_set_token_never_print_the_token(self):
        self.use_real_queue()
        self.run_once()
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            P.cmd_status(self.cfg(), None)
            P.cmd_check(self.cfg(), None)
        out = buf.getvalue()
        self.assertIn("working", out)
        self.assertIn("ready to post", out)
        self.assertNotIn(GOOD, out)
        self.assertEqual(P.scrub("token=" + GOOD + " and access_token=abc123"), "token=[token] and access_token=[token]")


class RulesTest(unittest.TestCase):
    HDR = {"allowed_dates": ["November 9", "November 17"]}

    def errs(self, text, date="2026-11-01"):
        return P.check_text(text, self.HDR, date)[0]

    def test_clean_posts_pass(self):
        for t in ["Pay in full for $3,000, or $3,500 on a plan: $500 down and the $3,000 balance over time.",
                  "Call or text (903) 913-6444.",
                  "Classes start Monday, November 9 and Tuesday, November 17.",
                  "Mon/Wed/Fri classes run 8:30 AM to 12:30 PM.",
                  "Read more: https://www.premierdentalacademyoflongview.com/tour"]:
            self.assertEqual(self.errs(t), [], t)

    def test_rules_catch_problems(self):
        cases = {
            "Save now — enroll today": "dash",
            "Big news #dentalassistant": "hashtag",
            "Premiere Dental Academy": "Premiere",
            "Only $1,997 today": "retired price",
            "Just $200 down locks your seat": "retired",
            "Join our night classes": "night",
            "We guarantee a job": "guarantee",
            "Call (903) 230-6444": "retired contact",
            "https://premierdentalacademyoflongview.com/tour": "www",
            "Starts December 5": "not on the approved list",
            "Starts Monday, November 17": "really a Tuesday",
            "Tours at 10:00 AM": "approved class time",
            "Only $500 down to start": "$3,500",
            "Pay $1,250 today": "not on the approved list",
            "Starts Nov 9": "abbreviated",
            "Starts 11/9": "numeric date",
            "Become a certified RDA in 12 weeks": "conflation",
        }
        for text, needle in cases.items():
            e = " | ".join(self.errs(text))
            self.assertIn(needle.lower(), e.lower(), f"{text!r} -> {e!r}")

    def test_real_queue_has_no_problems(self):
        q = P.read_queue_file(REAL_QUEUE)
        posts, problems, _ = P.validate_queue(q, PAGE)
        self.assertEqual(len(posts), 150)
        self.assertEqual(problems, [])
        self.assertEqual(len({p["key"] for p in posts}), 150)
        for p in posts:
            self.assertIn(p["key"][11:], ("07:45", "10:30", "13:15", "16:30", "19:15"))


if __name__ == "__main__":
    unittest.main()
