#!/usr/bin/env bash
# Installs or updates the pda-square command on the droplet. Safe to run again.
#
#   sudo bash install.sh <commit>        download that commit's ops/square files from GitHub
#   sudo bash install.sh --local <dir>   install from a local copy of ops/square
#
# It creates or changes only: /opt/pda-square and the link /usr/local/bin/pda-square.
# It does not touch pda-api, Caddy, the site folder, env files, other services or packages.
# (The pda-square command itself changes /etc/pda/api.env only when you run webhook-setup or
# set-webhook-key; see README.md.)
set -euo pipefail

REPO="RealRyanNichols/PremierDentalAcademyofLongview"
FILES="pda_square.py MANIFEST.sha256"

say() { printf '\n== %s\n' "$*"; }
die() { printf '\nSTOPPED: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run it with sudo"
command -v python3 >/dev/null || die "python3 is missing"
python3 -c 'import sys; sys.exit(sys.version_info < (3, 9))' || die "needs Python 3.9 or newer"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [ "${1:-}" = "--local" ]; then
  SRC="${2:?give the folder that holds pda_square.py}"
  say "Using local files from $SRC"
  for f in $FILES; do cp "$SRC/$f" "$WORK/$f"; done
else
  REF="${1:?give the commit to install, for example: sudo bash install.sh 1a2b3c4}"
  [[ "$REF" =~ ^[0-9a-f]{7,40}$ ]] || die "the commit must be a hex commit id"
  say "Downloading commit $REF from GitHub"
  for f in $FILES; do
    curl -fsSL --retry 3 "https://raw.githubusercontent.com/$REPO/$REF/ops/square/$f" -o "$WORK/$f" \
      || die "could not download $f"
  done
fi

say "Checking file fingerprints"
(cd "$WORK" && sha256sum --quiet -c MANIFEST.sha256) || die "a file did not match MANIFEST.sha256"
echo "all files match"

say "Installing pda-square"
install -d -o root -g root -m 0755 /opt/pda-square
install -o root -g root -m 0755 "$WORK/pda_square.py" /opt/pda-square/pda_square.py
install -o root -g root -m 0644 "$WORK/MANIFEST.sha256" /opt/pda-square/MANIFEST.sha256
ln -sf /opt/pda-square/pda_square.py /usr/local/bin/pda-square

say "Read-only status"
/usr/local/bin/pda-square status || true

cat <<'NEXT'

Installed. Next:  sudo pda-square webhook-setup
(It makes the droplet's Square webhook switched OFF, saves its signing key, restarts pda-api
and runs a self-test. Students are not affected until you run: sudo pda-square cutover)
Remove it any time: sudo rm -rf /opt/pda-square /usr/local/bin/pda-square
NEXT
