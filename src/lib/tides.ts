/** Conceptual M2/S2 forcing. Time is accelerated; units are arbitrary, not metres. */
export function tidalEnvelope(seconds: number, phaseDegrees: number) {
  const lunar = (phaseDegrees * Math.PI) / 180;
  const hours = (seconds * 2400) / 3600;
  return (
    0.65 * Math.cos((2 * Math.PI * hours) / 12.4206 - 2 * lunar) +
    0.3 * Math.cos((2 * Math.PI * hours) / 12)
  );
}
export function springNeapStrength(phaseDegrees: number) {
  return 0.5 + 0.5 * Math.cos((2 * phaseDegrees * Math.PI) / 180);
}
export function waterField(
  x: number,
  depth: number,
  seconds: number,
  phaseDegrees: number,
) {
  const swell = Math.sin(x * 36 + depth * 12 - seconds * 0.65);
  const crossing = Math.sin(x * 67 - depth * 17 + seconds * 0.43);
  const ripple = Math.sin(x * 167 + depth * 43 - seconds * 1.2);
  return (
    (swell * 0.48 + crossing * 0.3 + ripple * 0.14) *
    (0.8 + 0.2 * springNeapStrength(phaseDegrees))
  );
}
