#!/usr/bin/env bash
# Dream Labs Agent Server - provider runner with loop contracts.
#
# Usage: run-agent.sh <routine-id> [trigger]     trigger: cron | manual | api | webhook
#
# Every run is governed by the routine's contract:
#   - timeoutMinutes          hard budget cap (the run is killed past it)
#   - maxConsecutiveFailures  same-failure-twice rule: auto-pause + alert
#   - maxRunsPerDay           volume cap (skips + alerts once per day)
# A "resume" event from the dashboard clears the failure streak.
#
# Per-routine repos: each routine may name its own repo (set in the dashboard).
# Its code is cloned/pulled into a private per-routine workspace. Routines with
# no repo run in the shared default workspace (just the SOUL + instructions).
#
# Cross-platform: no flock / no GNU-timeout dependency, so it runs on Linux and
# macOS (BSD) alike. Locking is mkdir-based; timeout falls back to a watchdog.
set -euo pipefail

DL_DATA="${DL_DATA:-/var/dreamlabs}"
DL_APP="${DL_APP:-/opt/dreamlabs}"
# Resolve secrets: explicit env, else macOS (~/.dreamlabs) or Linux (/etc/dreamlabs).
# DL_DATA/DL_APP are then overridden by what secrets.env itself declares.
DL_SECRETS="${DL_SECRETS:-}"
if [ -z "$DL_SECRETS" ]; then
  for c in "$HOME/.dreamlabs/secrets.env" /etc/dreamlabs/secrets.env; do [ -f "$c" ] && { DL_SECRETS="$c"; break; }; done
  DL_SECRETS="${DL_SECRETS:-/etc/dreamlabs/secrets.env}"
fi

ID="${1:?usage: run-agent.sh <routine-id> [trigger]}"
TRIGGER="${2:-cron}"

[[ "$ID" =~ ^[a-z0-9][a-z0-9-]{0,39}$ ]] || { echo "invalid routine id: $ID" >&2; exit 2; }
case "$TRIGGER" in cron|manual|api|webhook) ;; *) echo "invalid trigger: $TRIGGER" >&2; exit 2 ;; esac

# Auto-export everything sourced, so the provider keys (and DL_NO_SUDO) reach the
# child agent-jail process. Without `set -a`, sourced vars stay un-exported and
# the agent would receive empty credentials.
set -a
# shellcheck disable=SC1090
source "$DL_SECRETS"
set +a

ROUTINES="$DL_DATA/routines.json"
RUNS="$DL_DATA/runs.jsonl"
LOCKDIR="$DL_DATA/locks"
OUTDIR="$DL_DATA/runs/$ID"
WORKSPACES="$DL_DATA/workspaces"
DEFAULT_WS="$DL_APP/workspace"
mkdir -p "$LOCKDIR" "$OUTDIR" "$WORKSPACES"
umask 002

# GitHub token: from secrets.env (GITHUB_TOKEN) or the dashboard "Connect GitHub" file.
# Used only by this runner for clones; never added to the agent-jail allowlist.
[ -z "${GITHUB_TOKEN:-}" ] && [ -f "$DL_DATA/github.token" ] && GITHUB_TOKEN="$(cat "$DL_DATA/github.token" 2>/dev/null)"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
TODAY="$(date -u +%Y%m%dT)"
LOG="$OUTDIR/$TS.log"

# ---------- portable lock (mkdir is atomic on every POSIX fs) ----------
acquire() { local d="$LOCKDIR/$1.lock.d" n=0; until mkdir "$d" 2>/dev/null; do sleep 0.05; n=$((n+1)); [ "$n" -ge 200 ] && return 1; done; }
release() { rmdir "$LOCKDIR/$1.lock.d" 2>/dev/null || true; }

# ---------- helpers ----------
jfield() { jq -r --arg id "$ID" ".routines[] | select(.id==\$id) | $1" "$ROUTINES" 2>/dev/null; }
append_row() { acquire runs || true; printf '%s\n' "$1" >> "$RUNS"; release runs; }
alert() {
  [ -n "${ALERT_TG_TOKEN:-}" ] && [ -n "${ALERT_TG_CHAT:-}" ] || return 0
  curl -fsS -m 10 "https://api.telegram.org/bot${ALERT_TG_TOKEN}/sendMessage" \
    -d chat_id="${ALERT_TG_CHAT}" --data-urlencode text="$1" >/dev/null 2>&1 || true
}
set_paused() {
  acquire routines || true
  jq --arg id "$ID" '.routines |= map(if .id==$id then .paused=true else . end)' "$ROUTINES" > "$ROUTINES.tmp" && mv "$ROUTINES.tmp" "$ROUTINES"
  release routines
}
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
run_with_timeout() { # run_with_timeout <secs> <cmd...>
  local secs="$1"; shift
  if command -v timeout >/dev/null 2>&1; then timeout --kill-after=30 "$secs" "$@"; return $?; fi
  if command -v gtimeout >/dev/null 2>&1; then gtimeout --kill-after=30 "$secs" "$@"; return $?; fi
  "$@" & local cmdpid=$!
  ( sleep "$secs"; kill -TERM "$cmdpid" 2>/dev/null; sleep 30; kill -KILL "$cmdpid" 2>/dev/null ) & local wd=$!
  local rc=0; wait "$cmdpid" 2>/dev/null || rc=$?
  kill -TERM "$wd" 2>/dev/null || true; wait "$wd" 2>/dev/null || true
  return "$rc"
}
# Per-routine git auth: store the token in THIS user's 600 cred file (never the
# group-readable workspace), so private pulls work but the jailed agent can't read it.
ensure_git_creds() {
  [ -n "${GITHUB_TOKEN:-}" ] || return 0
  local cf="$HOME/.git-credentials"
  [ -f "$cf" ] && return 0
  printf 'https://x-access-token:%s@github.com\n' "$GITHUB_TOKEN" > "$cf"; chmod 600 "$cf"
  git config --global credential.helper store >/dev/null 2>&1 || true
}
clone_repo() { # clone_repo <url> <dest>
  local url="$1" dest="$2" curl_url="$1"
  [ -n "${GITHUB_TOKEN:-}" ] && case "$url" in https://*) curl_url="https://x-access-token:${GITHUB_TOKEN}@${url#https://}";; esac
  git clone --depth 1 "$curl_url" "$dest" >>"$LOG" 2>&1 || return 1
  git -C "$dest" remote set-url origin "$url" >/dev/null 2>&1 || true   # F2: no token persisted in .git/config
}

# ---------- load routine + contract ----------
[ -n "$(jfield '.id')" ] || { echo "unknown routine: $ID" >&2; exit 2; }
PAUSED="$(jfield '.paused // false')"
PROV="$(jfield '.provider // empty')"; PROV="${PROV:-${PROVIDER:-claude}}"
MODEL="$(jfield '.model // ""')"
REPO_URL="$(jfield '.repo // ""')"
# The picker stores "owner/name"; accept that as well as a full URL.
if [ -n "$REPO_URL" ] && [[ "$REPO_URL" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then REPO_URL="https://github.com/$REPO_URL"; fi
TIMEOUT_MIN="$(jfield '.contract.timeoutMinutes // 20')"
MAX_FAILS="$(jfield '.contract.maxConsecutiveFailures // 2')"
MAX_RUNS_DAY="$(jfield '.contract.maxRunsPerDay // 96')"
INSTRUCTIONS="$(jfield '.instructions // ""')"
[ -n "$INSTRUCTIONS" ] || { echo "routine has no instructions: $ID" >&2; exit 2; }
TIMEOUT_SECS=$(( TIMEOUT_MIN * 60 ))

# ---------- contract gates ----------
[ "$PAUSED" = "true" ] && [ "$TRIGGER" != "manual" ] && exit 0

FAILS_BEFORE="$(trailing_failures)"
if [ "$FAILS_BEFORE" -ge "$MAX_FAILS" ] && [ "$TRIGGER" != "manual" ]; then set_paused; exit 0; fi

if [ "$TRIGGER" != "manual" ] && [ "$(runs_today)" -ge "$MAX_RUNS_DAY" ]; then
  CAPMARK="$LOCKDIR/$ID.capalerted.$TODAY"
  if [ ! -f "$CAPMARK" ]; then touch "$CAPMARK"
    append_row "{\"event\":\"skip\",\"reason\":\"daily-cap\",\"id\":\"$ID\",\"ts\":\"$TS\",\"trigger\":\"$TRIGGER\"}"
    alert "Dream Labs: routine '$ID' hit its daily run cap ($MAX_RUNS_DAY). Skipping until tomorrow (UTC)."
  fi
  exit 0
fi

RUNLOCK="$LOCKDIR/$ID.run.lock.d"
if ! mkdir "$RUNLOCK" 2>/dev/null; then
  if [ -n "$(find "$RUNLOCK" -maxdepth 0 -mmin +$((TIMEOUT_MIN + 5)) 2>/dev/null)" ]; then
    rmdir "$RUNLOCK" 2>/dev/null || true
    mkdir "$RUNLOCK" 2>/dev/null || { append_row "{\"event\":\"skip\",\"reason\":\"overlap\",\"id\":\"$ID\",\"ts\":\"$TS\",\"trigger\":\"$TRIGGER\"}"; exit 0; }
  else
    append_row "{\"event\":\"skip\",\"reason\":\"overlap\",\"id\":\"$ID\",\"ts\":\"$TS\",\"trigger\":\"$TRIGGER\"}"; exit 0
  fi
fi
trap 'rmdir "$RUNLOCK" 2>/dev/null || true' EXIT INT TERM

# ---------- run ----------
{
  echo "=== Dream Labs Agent Server run ==="
  echo "routine:  $ID"
  echo "provider: $PROV${MODEL:+ ($MODEL)}"
  echo "trigger:  $TRIGGER"
  echo "started:  $TS"
  echo "contract: timeout=${TIMEOUT_MIN}m maxConsecutiveFailures=$MAX_FAILS maxRunsPerDay=$MAX_RUNS_DAY"
  echo "===================================="
} > "$LOG"

# Resolve the workspace: per-routine repo if set, else the shared default.
if [ -n "$REPO_URL" ] && [[ "$REPO_URL" =~ ^(https?://|git@) ]]; then
  WORKSPACE="$WORKSPACES/$ID"
  ensure_git_creds
  if [ -d "$WORKSPACE/.git" ]; then
    echo "--- git pull ($REPO_URL) ---" >> "$LOG"
    git -C "$WORKSPACE" pull --ff-only >> "$LOG" 2>&1 || echo "(pull failed, continuing with existing checkout)" >> "$LOG"
  else
    echo "--- git clone ($REPO_URL) ---" >> "$LOG"
    clone_repo "$REPO_URL" "$WORKSPACE" || { echo "(clone failed; running with an empty workspace)" >> "$LOG"; mkdir -p "$WORKSPACE"; }
  fi
  echo "----------------" >> "$LOG"
else
  WORKSPACE="$DEFAULT_WS"; mkdir -p "$WORKSPACE"
fi

INSTRFILE="$OUTDIR/$TS.instr"
printf '%s' "$INSTRUCTIONS" > "$INSTRFILE"
chmod 640 "$INSTRFILE" 2>/dev/null || true
chgrp dlws "$INSTRFILE" 2>/dev/null || true

START_S=$SECONDS
set +e
run_with_timeout "$TIMEOUT_SECS" \
  "$DL_APP/bin/agent-jail.sh" "$PROV" "$WORKSPACE" "$INSTRFILE" "$MODEL" \
  >> "$LOG" 2>&1 < /dev/null
RC=$?
set -e
DUR=$((SECONDS - START_S))

case "$RC" in 124|137|143) echo "" >> "$LOG"; echo "CONTRACT: run exceeded its ${TIMEOUT_MIN}-minute budget and was stopped." >> "$LOG";; esac
echo "" >> "$LOG"; echo "=== finished rc=$RC duration=${DUR}s ===" >> "$LOG"

append_row "{\"event\":\"run\",\"id\":\"$ID\",\"ts\":\"$TS\",\"trigger\":\"$TRIGGER\",\"provider\":\"$PROV\",\"rc\":$RC,\"durationSec\":$DUR}"

# ---------- post-run contract enforcement ----------
if [ "$RC" -ne 0 ]; then
  FAILS_NOW=$((FAILS_BEFORE + 1))
  if [ "$FAILS_NOW" -ge "$MAX_FAILS" ]; then
    set_paused
    append_row "{\"event\":\"autopause\",\"id\":\"$ID\",\"ts\":\"$TS\",\"afterFailures\":$FAILS_NOW}"
    alert "Dream Labs: routine '$ID' AUTO-PAUSED after $FAILS_NOW consecutive failures (contract).${DASH_URL:+ $DASH_URL/routine/$ID}"
  else
    alert "Dream Labs: routine '$ID' failed (rc=$RC, ${DUR}s). Failure $FAILS_NOW of $MAX_FAILS before auto-pause.${DASH_URL:+ $DASH_URL/routine/$ID}"
  fi
fi
exit 0
