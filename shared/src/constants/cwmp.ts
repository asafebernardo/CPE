/** Minimum Periodic Inform interval (seconds) allowed by this CPE. */
export const MIN_PERIODIC_INFORM_INTERVAL_SEC = 10;

export function clampPeriodicInformInterval(seconds: number): number {
  const n = Math.floor(Number(seconds));
  if (!Number.isFinite(n)) return MIN_PERIODIC_INFORM_INTERVAL_SEC;
  return Math.max(MIN_PERIODIC_INFORM_INTERVAL_SEC, n);
}
