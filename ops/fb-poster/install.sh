#!/usr/bin/env bash
# Installs or updates pda-fb-poster on the droplet. Safe to run again (it keeps the ledger,
# the token and any local settings).
#
#   sudo bash install.sh <commit>        download that commit's ops/fb-poster files from GitHub
#   sudo bash install.sh --local <dir>   install from a local copy of ops/fb-poster
#
# It creates or changes only these things:
#   system user pdafb (no login) · /opt/pda-fb-poster · /var/lib/pda-fb-poster · /etc/pda-fb-poster
#   /usr/local/bin/pda-fb-poster · /etc/systemd/system/pda-fb-poster.{service,timer}
# It does not touch Caddy, other sites, other services, env files outside /etc/pda-fb-poster,
# packages, the firewall or SSH.
set -euo pipefail

REPO="RealRyanNichols/PremierDentalAcademyofLongview"
FILES="pda_fb_poster.py MANIFEST.sha256 deploy/pda-fb-poster.service deploy/pda-fb-poster.timer
deploy/poster.env queue/2026-10-24_to_2026-11-22.json photos/tray_colorbands.jpg photos/tray_setup.jpg
photos/fmx_whiteboard.jpg photos/empty_operatory.jpg"

say() { printf '\n== %s\n' "$*"; }
die() { printf '\nSTOPPED: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run it with sudo"
command -v python3 >/dev/null || die "python3 is missing"
python3 -c 'import sys, zoneinfo; zoneinfo.ZoneInfo("America/Chicago"); sys.exit(sys.version_info < (3, 9))' \
  || die "needs Python 3.9+ with time zone data"
command -v systemctl >/dev/null || die "systemd is missing"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [ "${1:-}" = "--local" ]; then
  SRC="${2:?give the folder that holds pda_fb_poster.py}"
  say "Using local files from $SRC"
  for f in $FILES; do mkdir -p "$WORK/$(dirname "$f")"; cp "$SRC/$f" "$WORK/$f"; done
else
  REF="${1:?give the commit to install, for example: sudo bash install.sh 1a2b3c4}"
  [[ "$REF" =~ ^[0-9a-f]{7,40}$ ]] || die "the commit must be a hex commit id"
  say "Downloading commit $REF from GitHub"
  for f in $FILES; do
    mkdir -p "$WORK/$(dirname "$f")"
    curl -fsSL --retry 3 "https://raw.githubusercontent.com/$REPO/$REF/ops/fb-poster/$f" -o "$WORK/$f" \
      || die "could not download $f"
  done
fi

say "Checking file fingerprints"
(cd "$WORK" && sha256sum --quiet -c MANIFEST.sha256) || die "a file did not match MANIFEST.sha256"
echo "all files match"

say "Creating the pdafb service user and folders"
id pdafb >/dev/null 2>&1 || useradd --system --home-dir /var/lib/pda-fb-poster --no-create-home \
  --shell /usr/sbin/nologin pdafb
install -d -o root -g root -m 0755 /opt/pda-fb-poster
install -d -o pdafb -g pdafb -m 0750 /var/lib/pda-fb-poster /var/lib/pda-fb-poster/queue /var/lib/pda-fb-poster/photos
install -d -o root -g pdafb -m 0750 /etc/pda-fb-poster

say "Installing the program"
install -o root -g root -m 0755 "$WORK/pda_fb_poster.py" /opt/pda-fb-poster/pda_fb_poster.py
ln -sf /opt/pda-fb-poster/pda_fb_poster.py /usr/local/bin/pda-fb-poster
install -o root -g root -m 0644 "$WORK/MANIFEST.sha256" /opt/pda-fb-poster/MANIFEST.sha256

FIRST=0
if [ ! -f /etc/pda-fb-poster/poster.env ]; then
  FIRST=1
  install -o root -g pdafb -m 0640 "$WORK/deploy/poster.env" /etc/pda-fb-poster/poster.env
  # Business Suite (Chrome) could load posts up to 29 days ahead; leave those slots to it.
  START="$(TZ=America/Chicago date -d '+29 days' '+%Y-%m-%dT%H:%M:%S%:z')"
  sed -i "s|^PDAFB_START_AFTER=.*|PDAFB_START_AFTER=$START|" /etc/pda-fb-poster/poster.env
  echo "settings created (posts after $START are the droplet's job)"
else
  echo "keeping the existing settings in /etc/pda-fb-poster/poster.env"
fi

say "Installing the approved post queue and photos"
for f in "$WORK"/queue/*.json; do install -o pdafb -g pdafb -m 0640 "$f" /var/lib/pda-fb-poster/queue/; done
for f in "$WORK"/photos/*; do install -o pdafb -g pdafb -m 0640 "$f" /var/lib/pda-fb-poster/photos/; done
/usr/local/bin/pda-fb-poster validate /var/lib/pda-fb-poster/queue/*.json || die "the queue did not pass the content rules"

say "Installing the timer (every 15 minutes)"
install -o root -g root -m 0644 "$WORK/deploy/pda-fb-poster.service" /etc/systemd/system/pda-fb-poster.service
install -o root -g root -m 0644 "$WORK/deploy/pda-fb-poster.timer" /etc/systemd/system/pda-fb-poster.timer
systemctl daemon-reload
systemctl enable --now pda-fb-poster.timer
systemctl start pda-fb-poster.service || true

say "Current status"
/usr/local/bin/pda-fb-poster status || true

if [ ! -s /etc/pda-fb-poster/token ]; then
  cat <<'NEXT'

Installed. One step left: give it the Facebook token.
  sudo pda-fb-poster set-token
(Paste the token when asked; it will not show on screen. See the README for how to get one.)
NEXT
else
  echo; echo "Installed and running. Check any time with: sudo pda-fb-poster status"
fi
[ "$FIRST" = 1 ] && echo "Undo everything: sudo systemctl disable --now pda-fb-poster.timer (details in the README)."
exit 0
