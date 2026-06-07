#!/usr/bin/env bash
# Dream Labs Agent Server — provider runner with loop contracts.
#
# Usage: run-agent.sh <routine-id> [trigger]     trigger: cron | manual | api | webhook
#
# Every run is governed by the routine's contract:
#   - timeoutMinutes          hard budget cap (timeout kills the run)
#   - maxConsecutiveFailures  same-failure-twice rule: auto-pause + alert
#   - maxRunsPerDay           volume cap (skips + alerts once per day)
# A "resume" event from the dashboard clears the failure streak.
set -euo pipefail

DL_DATA="${DL_DATA:-/var/dreamlabs}"
DL_APP="${DL_APP:-/opt/dreamlabs}"
DL_SECRETS="${DL_SECRETS:-/etc/dreamlabs/secrets.env}"

ID="${1:?usage: run-agent.sh <routine-id> [trigger]}"
TRIGGER="${2:-cron}"

# Strict id validation — this value touches file paths and jq filters.
[[ "$ID" =~ ^[a-z0-9][a-z0-9-]{0,39}$ ]] || { echo "invalid routine id: $ID" >&2; exit 2; }
case "$TRIGGER" in cron|manual|api|webhook) ;; *) echo "invalid trigger: $TRIGGER" >&2; exit 2 ;; esac

# shellcheck disable=SC1090
source "$DL_SECRETS"

ROUTINES="$DL_DATA/routines.json"
RUNS="$DL_DATA/runs.jsonl"
LOCKDIR="$DL_DATA/locks"
OUTDIR="$DL_DATA/runs/$ID"
WORKSPACE="$DL_APP/workspace"
mkdir -p "$LOCKDIR" "$OUTDIR"
umask 002   # group-writable workspace files so the agent user (group dlws) can edit them

TS="$(date -u +%Y%m%dT%H%M%SZ)"
TODAY="$(date -u +%Y%m%dT)"
LOG="$OUTDIR/$TS.log"
JLOCK="$LOCKDIR/routines.jsonlock"
RLOCK="$LOCKDIR/runs.jsonlock"
touch "$JLOCK" "$RLOCK"

# ---------- helpers ----------

jfield() { # jfield '<jq filter on the routine object>'
  jq -r --arg id "$ID" ".routines[] | select(.id==\$id) | $1" "$ROUTINES" 2>/dev/null
}

append_row() { # append one JSON line to runs.jsonl under a lock
  flock "$RLOCK" sh -c 'printf "%s\n" "$1" >> "$2"' _ "$1" "$RUNS"
}

alert() { # best-effort Telegram alert, never fails the run
  [ -n "${ALERT_TG_TOKEN:-}" ] && [ -n "${ALERT_TG_CHAT:-}" ] || return 0
  curl -fsS -m 10 "https://api.telegram.org/bot${ALERT_TG_TOKEN}/sendMessage" \
    -d chat_id="${ALERT_TG_CHAT}" --data-urlencode text="$1" >/dev/null 2>&1 || true
}

set_paused() { # atomically set paused=true on this routine
  flock "$JLOCK" sh -c '
    jq --arg id "$1" ".routines |= map(if .id==\$id then .paused=true else . end)" "$2" > "$2.tmp" \
      && mv "$2.tmp" "$2"
  ' _ "$ID" "$ROUTINES"
}

# Count trailing consecutive failures for this routine.
# The streak is broken by a successful run OR a "resume" event (human said try again).
trailing_failures() {
  [ -f "$RUNS" ] || { echo 0; return; }
  grep -F "\"id\":\"$ID\"" "$RUNS" | tail -n 50 | jq -s '
    [ .[] | select(.event=="run" or .event=="resume") ] | reverse
    | reduce .[] as $r ({n:0, stop:false};
        if .stop then .
        elif $r.event=="resume" then {n:.n, stop:true}
        elif $r.rc==0 then {n:.n, stop:true}
        else {n:(.n+1), stop:false} end)
    | .n' 2>/dev/null || echo 0
}

runs_today() {
  [ -f "$RUNS" ] || { echo 0; return; }
  grep -F "\"id\":\"$ID\"" "$RUNS" | grep -F "\"ts\":\"$TODAY" | grep -cF '"event":"run"' || true
}

# ---------- load routine + contract ----------

EXISTS="$(jfield '.id')"
[ -n "$EXISTS" ] || { echo "unknown routine: $ID" >&2; exit 2; }

PAUSED="$(jfield '.paused // false')"
PROV="$(jfield '.provider // empty')"; PROV="${PROV:-${PROVIDER:-claude}}"
MODEL="$(jfield '.model // ""')"
TIMEOUT_MIN="$(jfield '.contract.timeoutMinutes // 20')"
MAX_FAILS="$(jfield '.contract.maxConsecutiveFailures // 2')"
MAX_RUNS_DAY="$(jfield '.contract.maxRunsPerDay // 96')"
INSTRUCTIONS="$(jfield '.instructions // ""')"
[ -n "$INSTRUCTIONS" ] || { echo "routine has no instructions: $ID" >&2; exit 2; }

# ---------- contract gates (before any work) ----------

# Gate 1: paused. Manual runs are allowed (explicit human intent); automated ones are not.
if [ "$PAUSED" = "true" ] && [ "$TRIGGER" != "manual" ]; then
  exit 0
fi

# Gate 2: failure streak. Belt-and-braces — post-run logic should already have paused it.
FAILS_BEFORE="$(trailing_failures)"
if [ "$FAILS_BEFORE" -ge "$MAX_FAILS" ] && [ "$TRIGGER" != "manual" ]; then
  set_paused
  exit 0
fi

# Gate 3: daily volume cap (manual runs exempt — a human is watching).
if [ "$TRIGGER" != "manual" ]; then
  N_TODAY="$(runs_today)"
  if [ "${N_TODAY:-0}" -ge "$MAX_RUNS_DAY" ]; then
    CAPMARK="$LOCKDIR/$ID.capalerted.$TODAY"
    if [ ! -f "$CAPMARK" ]; then
      touch "$CAPMARK"
      append_row "{\"event\":\"skip\",\"reason\":\"daily-cap\",\"id\":\"$ID\",\"ts\":\"$TS\",\"trigger\":\"$TRIGGER\"}"
      alert "Dream Labs · routine '$ID' hit its daily run cap ($MAX_RUNS_DAY). Skipping until tomorrow (UTC)."
    fi
    exit 0
  fi
fi

# Gate 4: no overlapping runs.
exec 9>"$LOCKDIR/$ID.lock"
if ! flock -n 9; then
  append_row "{\"event\":\"skip\",\"reason\":\"overlap\",\"id\":\"$ID\",\"ts\":\"$TS\",\"trigger\":\"$TRIGGER\"}"
  exit 0
fi

# ---------- run ----------

RUNMARK="$LOCKDIR/$ID.running"
echo "$$ $TS" > "$RUNMARK"
trap 'rm -f "$RUNMARK"' EXIT INT TERM

{
  echo "=== Dream Labs Agent Server run ==="
  echo "routine:  $ID"
  echo "provider: $PROV${MODEL:+ ($MODEL)}"
  echo "trigger:  $TRIGGER"
  echo "started:  $TS"
  echo "contract: timeout=${TIMEOUT_MIN}m maxConsecutiveFailures=$MAX_FAILS maxRunsPerDay=$MAX_RUNS_DAY"
  echo "===================================="
} > "$LOG"

# Keep the workspace fresh. Pull runs as the service user (credentials live in its
# git credential store, never in the agent's environment). Failure is non-fatal.
if [ -d "$WORKSPACE/.git" ]; then
  echo "--- git pull ---" >> "$LOG"
  git -C "$WORKSPACE" pull --ff-only >> "$LOG" 2>&1 || echo "(pull failed, continuing with existing checkout)" >> "$LOG"
  echo "----------------" >> "$LOG"
fi

# Instructions travel by file, group-readable by the agent user only.
INSTRFILE="$OUTDIR/$TS.instr"
printf '%s' "$INSTRUCTIONS" > "$INSTRFILE"
chmod 640 "$INSTRFILE"
chgrp dlws "$INSTRFILE" 2>/dev/null || true

START_S=$SECONDS
set +e
timeout --kill-after=30 "${TIMEOUT_MIN}m" \
  "$DL_APP/bin/agent-jail.sh" "$PROV" "$WORKSPACE" "$INSTRFILE" "$MODEL" \
  >> "$LOG" 2>&1 < /dev/null
RC=$?
set -e
DUR=$((SECONDS - START_S))

if [ "$RC" -eq 124 ] || [ "$RC" -eq 137 ]; then
  echo "" >> "$LOG"
  echo "CONTRACT: run exceeded its ${TIMEOUT_MIN}-minute budget and was stopped." >> "$LOG"
fi
echo "" >> "$LOG"
echo "=== finished rc=$RC duration=${DUR}s ===" >> "$LOG"

append_row "{\"event\":\"run\",\"id\":\"$ID\",\"ts\":\"$TS\",\"trigger\":\"$TRIGGER\",\"provider\":\"$PROV\",\"rc\":$RC,\"durationSec\":$DUR}"

# ---------- post-run contract enforcement ----------

if [ "$RC" -ne 0 ]; then
  FAILS_NOW=$((FAILS_BEFORE + 1))
  if [ "$FAILS_NOW" -ge "$MAX_FAILS" ]; then
    set_paused
    append_row "{\"event\":\"autopause\",\"id\":\"$ID\",\"ts\":\"$TS\",\"afterFailures\":$FAILS_NOW}"
    alert "Dream Labs · routine '$ID' AUTO-PAUSED after $FAILS_NOW consecutive failures (contract). Last log: $LOG${DASH_URL:+ · $DASH_URL/routine/$ID}"
  else
    alert "Dream Labs · routine '$ID' failed (rc=$RC, ${DUR}s). Failure $FAILS_NOW of $MAX_FAILS before auto-pause.${DASH_URL:+ $DASH_URL/routine/$ID}"
  fi
fi

exit 0
