/** Equilibrium tide geometry, not a calibrated coastal prediction. Angles are radians. */
export interface TidalGeometry {
  latitude: number;
  lunarDeclination: number;
  solarDeclination: number;
  lunarHourAngle: number;
  solarHourAngle: number;
  lunarDistance: number;
  solarDistance: number;
}
export const TIDE_ACCELERATION = 720;
const TAU = Math.PI * 2;
const MEAN_LUNAR_DISTANCE_AU = 384400 / 149597870.7;
export function equilibriumPotential(
  latitude: number,
  declination: number,
  hourAngle: number,
) {
  const vertical =
    Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle);
  return (3 * vertical * vertical - 1) / 2;
}
export function tidalEnvelope(
  seconds: number,
  geometry: TidalGeometry | number,
) {
  // Numeric input is an equatorial reference configuration useful for static art/tests.
  const g: TidalGeometry =
    typeof geometry === "number"
      ? {
          latitude: 0,
          lunarDeclination: 0,
          solarDeclination: 0,
          lunarHourAngle: (geometry * Math.PI) / 180,
          solarHourAngle: 0,
          lunarDistance: MEAN_LUNAR_DISTANCE_AU,
          solarDistance: 1,
        }
      : geometry;
  const hours = (seconds * TIDE_ACCELERATION) / 3600;
  const moon = equilibriumPotential(
    g.latitude,
    g.lunarDeclination,
    g.lunarHourAngle + (TAU * hours) / 24.8412,
  );
  const sun = equilibriumPotential(
    g.latitude,
    g.solarDeclination,
    g.solarHourAngle + (TAU * hours) / 24,
  );
  return (
    0.65 * (MEAN_LUNAR_DISTANCE_AU / g.lunarDistance) ** 3 * moon +
    0.3 * (1 / g.solarDistance) ** 3 * sun
  );
}
export function springNeapStrength(phaseDegrees: number) {
  return 0.5 + 0.5 * Math.cos((2 * phaseDegrees * Math.PI) / 180);
}
// Directional, incommensurate wavelengths: swell, cross sea, wind waves, capillaries.
const WAVES = [
  [1.7, 3.2, 0.43, 0.39],
  [-2.3, 4.7, 0.24, 0.51],
  [4.1, 7.9, 0.13, 0.73],
  [-8.7, 13.1, 0.065, 1.04],
  [16.3, 21.7, 0.028, 1.41],
  [-29.1, 37.3, 0.012, 1.89],
] as const;
export interface WaveSample {
  height: number;
  slopeX: number;
  slopeZ: number;
  ripple: number;
}
export function wavePhases(seconds: number) {
  return WAVES.map((wave, i) => -seconds * wave[3] + i * 2.399963);
}
export function sampleWaves(
  x: number,
  z: number,
  seconds: number,
  phases: readonly number[],
  out: WaveSample,
) {
  // Slow domain warping breaks the regular appearance of superposed sine waves.
  const u = x + 0.19 * Math.sin(z * 0.73 + seconds * 0.12);
  const v = z + 0.13 * Math.sin(x * 0.61 - seconds * 0.09);
  let height = 0,
    slopeX = 0,
    slopeZ = 0,
    ripple = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const [kx, kz, amplitude] = WAVES[i]!;
    const phase = kx * u + kz * v + phases[i]!;
    const s = Math.sin(phase),
      c = Math.cos(phase);
    height += amplitude * s;
    slopeX += amplitude * kx * c;
    slopeZ += amplitude * kz * c;
    if (i >= 3) ripple += amplitude * s;
  }
  out.height = height;
  out.slopeX = slopeX;
  out.slopeZ = slopeZ;
  out.ripple = ripple;
  return out;
}
export function waterField(
  x: number,
  depth: number,
  seconds: number,
  phaseDegrees: number,
) {
  const sample = sampleWaves(x * 5, depth * 5, seconds, wavePhases(seconds), {
    height: 0,
    slopeX: 0,
    slopeZ: 0,
    ripple: 0,
  });
  return sample.height * (0.8 + 0.2 * springNeapStrength(phaseDegrees));
}
