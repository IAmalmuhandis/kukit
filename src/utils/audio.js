// Web Audio alarm — generated tone, no external asset needed.
// Three escalating stages so attention ramps up instead of jumping straight
// to full alarm: a one-time heads-up chime at 1 minute left, soft ticks on
// the final 20 seconds (the main time warning — see useTimers), then a loud
// siren-style alarm at zero that loops until dismissed.

let audioCtx = null;
let loopTimer = null;
let unlocked = false;

function getContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

// Call this from a real user gesture (clicking "Start") so the browser's
// autoplay policy allows the context to produce sound later, even when a
// stage fires automatically with no fresh gesture attached.
export function primeAudio() {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  unlocked = true;
}

function beep(ctx, startAt, freq, duration, volume, type = 'triangle') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  // Quick attack, short hold, quick release — avoids a harsh click and
  // keeps each beep crisp and distinct.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.setValueAtTime(volume, startAt + duration - 0.03);
  gain.gain.linearRampToValueAtTime(0, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

// Stage 1 — one-time, gentle heads-up the moment a timer crosses under a
// minute left. Not looped, not urgent, just "hey, look over here soon".
export function playWarningChime() {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  [660, 880].forEach((freq, i) => {
    beep(ctx, now + i * 0.14, freq, 0.12, 0.22, 'triangle');
  });
}

// Stage 2 — a single soft tick, meant to be called once per second on the
// final 20 seconds of a timer, like an old wind-up kitchen dial speeding up.
export function playTick() {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  beep(ctx, ctx.currentTime, 1200, 0.05, 0.18, 'square');
}

// Stage 3 — the timer is done. Harsher waveform, alternating high/low
// frequencies, tighter spacing than the old ascending triple-beep: reads as
// an actual alarm going off, not a polite notification sound.
function playAlarmPattern() {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  const dur = 0.13;
  const gap = 0.05;
  [1046, 784, 1046, 784].forEach((freq, i) => {
    beep(ctx, now + i * (dur + gap), freq, dur, 0.42, 'square');
  });
}

// Starts (or no-ops if already running) the looping alarm pattern.
// Returns nothing — call stopAlarm() to silence it.
export function startAlarm() {
  if (loopTimer) return; // already looping
  if (!unlocked) primeAudio();
  playAlarmPattern();
  loopTimer = setInterval(playAlarmPattern, 900);
}

export function stopAlarm() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}

export function isAlarmPlaying() {
  return loopTimer !== null;
}
