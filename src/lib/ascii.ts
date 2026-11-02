import {
  sampleWaves,
  tidalEnvelope,
  wavePhases,
  type TidalGeometry,
  type WaveSample,
} from "./tides";

export const GLYPHS = " .,:;irsxXA253hMHGS#9B&@-~=+*%";
export const SHADES = 24;
export const TONES = 4;
const moonRamp = " .,:;irsxXA253hMHGS#9B&@";
const seaRamp = " .,:;-~=+x*#%@";
const moonCodes = [...moonRamp].map((g) => GLYPHS.indexOf(g));
const seaCodes = [...seaRamp].map((g) => GLYPHS.indexOf(g));
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const smooth = (lo: number, hi: number, n: number) => {
  const t = clamp((n - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
export function cellGlyph(code: number) {
  return GLYPHS[code & 63] ?? " ";
}
export function cellTone(code: number) {
  return Math.floor((code >> 6) / SHADES);
}
export function cellShade(code: number) {
  return (code >> 6) % SHADES;
}
function ink(glyph: number, tone: number, light: number) {
  if (!glyph || light < 1 / SHADES) return 0;
  return (
    glyph |
    ((tone * SHADES +
      Math.min(SHADES - 1, Math.floor(clamp(light) * SHADES))) <<
      6)
  );
}
function hash(x: number, y: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = x - ix,
    fy = y - iy;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  return (
    (hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u) * (1 - v) +
    (hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u) * v
  );
}
function terrain(x: number, y: number) {
  return (
    0.5 * noise(x * 5 + 13, y * 5 + 7) +
    0.27 * noise(x * 13 + 2, y * 13 + 23) +
    0.15 * noise(x * 31 + 7, y * 31 + 11) +
    0.08 * noise(x * 79, y * 79)
  );
}
const craters = Array.from({ length: 46 }, (_, i) => {
  const angle = i * 2.399963,
    r = Math.sqrt((i + 0.5) / 46) * 0.92;
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
    r: 0.018 + hash(i, 21) ** 3 * 0.13,
  };
});
const maria = [
  [-0.28, -0.34, 0.46, 0.26],
  [0.31, -0.24, 0.36, 0.37],
  [-0.49, 0.05, 0.26, 0.49],
  [0.07, 0.2, 0.23, 0.17],
] as const;
/** Shared phase light: projected illuminated area equals the physical fraction. */
export function lunarLight(angle: number, fraction: number) {
  const z = clamp(fraction) * 2 - 1;
  const x =
    (Math.sin((angle * Math.PI) / 180) >= 0 ? 1 : -1) *
    Math.sqrt(Math.max(0, 1 - z * z));
  return { x, z };
}
export interface Scene {
  width: number;
  height: number;
  cols: number;
  rows: number;
  cw: number;
  ch: number;
  moonX: number;
  moonY: number;
  radius: number;
  mobile: boolean;
  fraction: number;
  angle: number;
  light: ReturnType<typeof lunarLight>;
  forcing: TidalGeometry | number;
}
export function createScene(
  width: number,
  height: number,
  cellHeight: number,
  angle: number,
  fraction = (1 - Math.cos((angle * Math.PI) / 180)) / 2,
  forcing: TidalGeometry | number = angle,
): Scene {
  const mobile = width < 700,
    cw = cellHeight * 0.58;
  return {
    width,
    height,
    cols: Math.ceil(width / cw),
    rows: Math.ceil(height / cellHeight),
    cw,
    ch: cellHeight,
    moonX: width * (mobile ? 0.7 : 0.775),
    moonY: height * (mobile ? 0.19 : 0.265),
    radius: Math.min(
      width * (mobile ? 0.19 : 0.112),
      height * (mobile ? 0.11 : 0.163),
    ),
    mobile,
    fraction: clamp(fraction),
    angle,
    light: lunarLight(angle, fraction),
    forcing,
  };
}
export function skyCell(scene: Scene, col: number, row: number) {
  const px = (col + 0.5) * scene.cw,
    py = (row + 0.5) * scene.ch;
  const x = (px - scene.moonX) / scene.radius,
    y = (py - scene.moonY) / scene.radius;
  const r2 = x * x + y * y;
  if (r2 <= 1) {
    const z = Math.sqrt(1 - r2),
      direct = x * scene.light.x + z * scene.light.z;
    // Broad basaltic maria, fractal highlands, crater rims, and restrained Tycho-like rays.
    let albedo = 0.72 + 0.35 * terrain(x, y);
    for (const [mx, my, rx, ry] of maria)
      albedo -= 0.25 * Math.exp(-(((x - mx) / rx) ** 2 + ((y - my) / ry) ** 2));
    let relief = 0;
    for (const crater of craters) {
      const d = Math.hypot(x - crater.x, y - crater.y) / crater.r;
      if (d < 1.4) {
        albedo -= 0.17 * Math.exp(-d * d * 3);
        albedo += 0.16 * Math.exp(-(((d - 1) / 0.17) ** 2));
        relief +=
          (0.1 *
            Math.exp(-(((d - 0.9) / 0.25) ** 2)) *
            ((x - crater.x) * scene.light.x + (y - crater.y) * 0.2)) /
          crater.r;
      }
    }
    const rayAngle = Math.atan2(y - 0.55, x + 0.12),
      rayDistance = Math.hypot(x + 0.12, y - 0.55);
    albedo +=
      0.065 *
      Math.max(0, Math.cos(rayAngle * 19 + noise(x * 4, y * 4))) ** 14 *
      Math.exp(-rayDistance * 1.8);
    // Lommel-Seeliger-like rough diffuse response: no polished/plastic sphere highlight.
    const diffuse = direct > 0 ? Math.sqrt(direct / (direct + z + 0.12)) : 0;
    const limb = smooth(0, 0.055, 1 - r2);
    const light = clamp(
      (0.018 + (diffuse + (direct > 0 ? relief : 0)) * albedo * 1.15) * limb,
    );
    const glyph =
      moonCodes[
        Math.max(1, Math.floor(clamp(light ** 0.75) * (moonCodes.length - 1)))
      ]!;
    return ink(glyph, 1, light);
  }
  // A faint, entirely character-based lunar aureole. Static texture never boils.
  if (r2 < 3.8 && scene.fraction > 0.04 && hash(col, row) > 0.61) {
    const glow = Math.exp(-(Math.sqrt(r2) - 1) * 3.5) * scene.fraction * 0.13;
    return ink(GLYPHS.indexOf("."), 0, glow);
  }
  if (py < scene.height * 0.52) {
    const star = hash(col + 901, row + 407);
    if (star > 0.9984)
      return ink(
        GLYPHS.indexOf(star > 0.99988 ? "+" : "."),
        star > 0.99975 ? 2 : 3,
        0.22 + hash(row, col) * 0.36,
      );
  }
  return 0;
}
export interface WaterFrame {
  time: number;
  horizon: number;
  phases: readonly number[];
  lightX: number;
}
export function waterFrame(scene: Scene, time: number): WaterFrame {
  return {
    time,
    horizon: scene.height * (0.55 + tidalEnvelope(time, scene.forcing) * 0.019),
    phases: wavePhases(time),
    lightX:
      scene.moonX +
      Math.sin((scene.angle * Math.PI) / 180) *
        (1 - scene.fraction) *
        scene.radius *
        0.38,
  };
}
export function waterCell(
  scene: Scene,
  frame: WaterFrame,
  col: number,
  row: number,
  out: WaveSample,
) {
  const px = (col + 0.5) * scene.cw,
    py = (row + 0.5) * scene.ch;
  if (py < frame.horizon) return 0;
  const depth = (py - frame.horizon) / (scene.height - frame.horizon);
  const z = 0.62 / (depth + 0.075);
  const x = (px / scene.width - 0.5) * (2.7 + z * 0.92);
  const wave = sampleWaves(x, z, frame.time, frame.phases, out);
  const crest = smooth(-0.5, 0.65, wave.height);
  const facets = Math.pow(clamp(1 - Math.abs(wave.slopeZ * 0.55 - 0.12)), 5);
  const shimmerX =
    frame.lightX / scene.width +
    wave.height * (0.005 + depth * 0.013) +
    wave.ripple * depth * 0.045;
  const width = 0.012 + depth ** 1.15 * 0.095;
  const corridor = Math.exp(-(((px / scene.width - shimmerX) / width) ** 2));
  const reflection =
    scene.fraction ** 0.72 *
    corridor *
    (0.28 + 0.72 * facets) *
    (0.38 + 0.62 * crest);
  const fresnel = 0.5 + 0.5 * (1 - depth) ** 2;
  const distant = smooth(0, 0.045, depth);
  const ridge = Math.exp(
    -(((wave.height - 0.24) / (0.13 + (1 - depth) * 0.1)) ** 2),
  );
  const fine = smooth(0.015, 0.09, wave.ripple);
  const ambient =
    (0.035 + crest * 0.06 + ridge * 0.43 + fine * 0.08 * crest) *
    (0.65 + fresnel * 0.35);
  const light = clamp((ambient + reflection * 0.8) * distant);
  const shade = clamp(light ** 0.82);
  let glyph = seaCodes[Math.max(1, Math.floor(shade * (seaCodes.length - 1)))]!;
  let tone = 0;
  if (reflection > 0.12) {
    tone = 1;
    glyph =
      seaCodes[
        Math.max(
          1,
          Math.floor(clamp((light + 0.1) ** 0.65) * (seaCodes.length - 1)),
        )
      ]!;
  } else if (
    reflection > 0.04 &&
    reflection < 0.12 &&
    wave.ripple > 0.028 &&
    ridge > 0.35
  )
    tone = 2;
  return ink(glyph, tone, tone === 1 ? clamp(light * 1.08) : shade * 0.95);
}
export function staticScene(
  angle: number,
  mobile = false,
  fraction?: number,
  forcing?: TidalGeometry,
) {
  const cols = mobile ? 64 : 196,
    rows = mobile ? 92 : 84;
  const scene = createScene(
    cols * 0.58 * 10,
    rows * 10,
    10,
    angle,
    fraction,
    forcing,
  );
  // Geometry is selected by the rendered snapshot dimensions, not the grid count.
  scene.mobile = mobile;
  scene.moonX = scene.width * (mobile ? 0.7 : 0.775);
  scene.moonY = scene.height * (mobile ? 0.19 : 0.265);
  scene.radius = Math.min(
    scene.width * (mobile ? 0.19 : 0.112),
    scene.height * (mobile ? 0.11 : 0.163),
  );
  const frame = waterFrame(scene, 0),
    sample: WaveSample = { height: 0, slopeX: 0, slopeZ: 0, ripple: 0 };
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const water = waterCell(scene, frame, col, row, sample);
      if (water) return cellGlyph(water);
      const sky = skyCell(scene, col, row);
      // Plain-text fallbacks cannot encode the halo's very low per-cell opacity.
      return cellTone(sky) === 0 ? " " : cellGlyph(sky);
    }).join(""),
  ).join("\n");
}
