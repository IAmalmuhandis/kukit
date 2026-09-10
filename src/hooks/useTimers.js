import { useCallback, useEffect, useRef, useState } from 'react';
import { notifyTimerDone, notifyTimerWarning } from '../utils/notifications';
import { primeAudio, playTick, playWarningChime } from '../utils/audio';

const WARNING_THRESHOLD_SECONDS = 60;
const TICK_THRESHOLD_SECONDS = 20;

const STORAGE_KEY = 'cook-timer.timers.v1';

function loadTimers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    // A timer that finished while the app/laptop was asleep or closed still
    // needs to land in "done" so it's visible + alarmed on return — it just
    // can't retroactively make a sound for the time that already passed.
    return parsed.map((t) => {
      if (t.status === 'running' && t.endAt <= now) {
        return { ...t, status: 'done', remainingSeconds: 0 };
      }
      return t;
    });
  } catch {
    return [];
  }
}

function remainingFor(timer, now) {
  if (timer.status === 'running') {
    return Math.max(0, Math.round((timer.endAt - now) / 1000));
  }
  return timer.remainingSeconds;
}

export function useTimers() {
  const [timers, setTimers] = useState(loadTimers);
  const [now, setNow] = useState(Date.now);
  const notifiedRef = useRef(new Set());
  const warnedRef = useRef(new Set());
  const tickWarnedRef = useRef(new Set());

  // Persist on every change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

  // Ticks once a second. This is the thing that actually makes the on-screen
  // countdown move — `remainingFor()` is only ever recomputed on render, so
  // without a state update tied to the clock the displayed number would
  // freeze at whatever it was right after the timer started.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Flip anything that has hit zero over to "done".
  useEffect(() => {
    setTimers((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        if (t.status !== 'running') return t;
        if (remainingFor(t, now) <= 0) {
          changed = true;
          return { ...t, status: 'done', remainingSeconds: 0 };
        }
        return t;
      });
      return changed ? next : prev;
    });
  }, [now]);

  // Escalate attention as a running timer closes in on zero: a one-time
  // "under a minute" chime the moment it crosses that threshold, then —
  // the main time warning — a soft tick every second for the final 20
  // seconds, paired with a one-time desktop notification the moment that
  // window starts (so it's still noticeable with the tab backgrounded or
  // the sound missed, not just audible). The alarm at zero is the last,
  // loudest stage.
  useEffect(() => {
    for (const t of timers) {
      if (t.status !== 'running') continue;
      const remaining = remainingFor(t, now);
      if (remaining <= 0) continue;
      if (remaining <= WARNING_THRESHOLD_SECONDS && !warnedRef.current.has(t.id)) {
        warnedRef.current.add(t.id);
        playWarningChime();
      }
      if (remaining <= TICK_THRESHOLD_SECONDS) {
        playTick();
        if (!tickWarnedRef.current.has(t.id)) {
          tickWarnedRef.current.add(t.id);
          notifyTimerWarning(t.label, remaining);
        }
      }
    }
  }, [now]);

  // Fire the desktop notification exactly once per timer, the moment it
  // transitions into "done".
  useEffect(() => {
    for (const t of timers) {
      if (t.status === 'done' && !notifiedRef.current.has(t.id)) {
        notifiedRef.current.add(t.id);
        notifyTimerDone(t.label);
      }
    }
  }, [timers]);

  const addTimer = useCallback((label, totalSeconds) => {
    primeAudio(); // unlock audio now, from this click, for the later alarm
    const now = Date.now();
    const id = crypto.randomUUID();
    setTimers((prev) => [
      ...prev,
      {
        id,
        label,
        totalSeconds,
        remainingSeconds: totalSeconds,
        endAt: now + totalSeconds * 1000,
        status: 'running',
        createdAt: now,
      },
    ]);
    return id;
  }, []);

  const pauseTimer = useCallback((id) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== 'running') return t;
        return { ...t, status: 'paused', remainingSeconds: remainingFor(t, Date.now()) };
      })
    );
  }, []);

  const resumeTimer = useCallback((id) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== 'paused') return t;
        return { ...t, status: 'running', endAt: Date.now() + t.remainingSeconds * 1000 };
      })
    );
  }, []);

  // Nudge a timer's remaining time. Works while running, paused, or even
  // after it's finished (adding time to a "done" timer revives it — handy
  // for "ok five more minutes").
  const adjustTimer = useCallback((id, deltaSeconds) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (t.status === 'running') {
          const newRemaining = Math.max(0, remainingFor(t, Date.now()) + deltaSeconds);
          if (newRemaining > WARNING_THRESHOLD_SECONDS) warnedRef.current.delete(t.id);
          if (newRemaining > TICK_THRESHOLD_SECONDS) tickWarnedRef.current.delete(t.id);
          return { ...t, endAt: Date.now() + newRemaining * 1000 };
        }
        if (t.status === 'paused') {
          const newRemaining = Math.max(0, t.remainingSeconds + deltaSeconds);
          if (newRemaining > WARNING_THRESHOLD_SECONDS) warnedRef.current.delete(t.id);
          if (newRemaining > TICK_THRESHOLD_SECONDS) tickWarnedRef.current.delete(t.id);
          return { ...t, remainingSeconds: newRemaining };
        }
        if (t.status === 'done' && deltaSeconds > 0) {
          notifiedRef.current.delete(t.id);
          warnedRef.current.delete(t.id);
          tickWarnedRef.current.delete(t.id);
          return { ...t, status: 'running', endAt: Date.now() + deltaSeconds * 1000 };
        }
        return t;
      })
    );
  }, []);

  const restartTimer = useCallback((id) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        notifiedRef.current.delete(t.id);
        warnedRef.current.delete(t.id);
        tickWarnedRef.current.delete(t.id);
        return {
          ...t,
          status: 'running',
          remainingSeconds: t.totalSeconds,
          endAt: Date.now() + t.totalSeconds * 1000,
        };
      })
    );
  }, []);

  const removeTimer = useCallback((id) => {
    notifiedRef.current.delete(id);
    warnedRef.current.delete(id);
    tickWarnedRef.current.delete(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const enriched = timers
    .map((t) => ({ ...t, remainingSeconds: remainingFor(t, now) }))
    .sort((a, b) => a.createdAt - b.createdAt);

  const anyDone = enriched.some((t) => t.status === 'done');

  return {
    timers: enriched,
    anyDone,
    addTimer,
    pauseTimer,
    resumeTimer,
    adjustTimer,
    restartTimer,
    removeTimer,
  };
}