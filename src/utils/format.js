export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (s < 60) return `${s}s`;
  return `${m} min`;
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDays(days) {
  if (days == null) return '—';
  if (days < 1.5) return 'about a day';
  if (days < 13) return `about ${Math.round(days)} days`;
  if (days < 60) return `about ${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
  return `about ${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
}
