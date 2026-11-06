// Accepts "YYYY-MM-DD" or "MM/DD/YYYY" and returns local midnight on that day.
export function parseUnlockDate(unlockDate: string): Date {
  const s = unlockDate.trim();

  // YYYY-MM-DD (also matches the date part of an ISO timestamp)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  // MM/DD/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));

  return new Date(s); // last resort
}

export function isCapsuleLocked(unlockDate: string, now: Date = new Date()): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today.getTime() < parseUnlockDate(unlockDate).getTime();
}

export function daysUntilUnlock(unlockDate: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = parseUnlockDate(unlockDate).getTime() - today.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}