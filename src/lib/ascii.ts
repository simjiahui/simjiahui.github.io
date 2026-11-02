import { tidalEnvelope, waterField } from "./tides";
const ramp = " .,:;irsxXA253hMHGS#9B&@";
const craters: [number, number, number][] = [
  [-0.35, -0.23, 0.2],
  [0.35, 0.2, 0.26],
  [-0.05, 0.5, 0.16],
  [0.3, -0.5, 0.16],
  [-0.5, 0.35, 0.12],
  [0.02, -0.1, 0.12],
];
export type Cell = {
  glyph: string;
  tone: "moon" | "water" | "pink" | "star";
  alpha: number;
};
export function sceneCell(
  col: number,
  row: number,
  cols: number,
  rows: number,
  time: number,
  angle: number,
  mobile = false,
): Cell | null {
  const x = col / cols,
    y = row / rows;
  const moonX = mobile ? 0.7 : 0.77,
    moonY = mobile ? 0.2 : 0.29;
  const radius = Math.min(cols * 0.56 * (mobile ? 0.19 : 0.115), rows * 0.17);
  const mx = ((col - cols * moonX) * 0.56) / radius;
  const my = (row - rows * moonY) / radius;
  const r2 = mx * mx + my * my;
  if (r2 <= 1) {
    const z = Math.sqrt(1 - r2),
      phase = (angle * Math.PI) / 180;
    const light = Math.max(0, mx * Math.sin(phase) - z * Math.cos(phase));
    let texture =
      0.78 + 0.12 * Math.sin(mx * 29 + Math.cos(my * 27)) * Math.cos(my * 33);
    for (const [cx, cy, r] of craters) {
      const d = Math.hypot(mx - cx, my - cy);
      if (d < r) texture -= 0.24 * (1 - d / r);
      if (Math.abs(d - r) < 0.025) texture += 0.14;
    }
    const intensity = Math.min(1, Math.max(0, (0.07 + 0.93 * light) * texture));
    return {
      glyph: ramp[Math.max(1, Math.floor(intensity * (ramp.length - 1)))]!,
      tone: "moon",
      alpha: 0.3 + intensity * 0.7,
    };
  }
  const horizon = 0.59 + tidalEnvelope(time, angle) * 0.019;
  if (y > horizon) {
    const depth = (y - horizon) / (1 - horizon);
    const wave = waterField(x, depth, time, angle);
    const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
    const reflectedX =
      moonX + Math.sin(depth * 24 - time * 0.4) * (0.006 + depth * 0.018);
    const reflection =
      Math.exp(-Math.pow((x - reflectedX) / (0.024 + depth * 0.1), 2)) *
      (0.15 + illumination * 0.85);
    const brightness = Math.max(
      0,
      Math.min(1, 0.12 + wave * 0.48 + reflection * (0.4 + wave * 0.5)),
    );
    if (brightness < 0.07) return null;
    const glyphs = " .,-~:;=+*x#";
    return {
      glyph: glyphs[Math.floor(brightness * (glyphs.length - 1))]!,
      tone:
        reflection > 0.25
          ? "moon"
          : wave > 0.35 && depth > 0.45
            ? "pink"
            : "water",
      alpha: 0.2 + brightness * 0.6,
    };
  }
  const seed = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  if (seed - Math.floor(seed) > 0.997 && y < horizon - 0.04)
    return {
      glyph: col % 3 === 0 ? "+" : ".",
      tone: "star",
      alpha: 0.35 + 0.2 * Math.sin(time * 0.2 + col),
    };
  return null;
}
export function staticScene(angle: number, mobile = false) {
  const cols = mobile ? 52 : 156;
  const rows = 65;
  return Array.from({ length: rows }, (_, row) =>
    Array.from(
      { length: cols },
      (_, col) =>
        sceneCell(col, row, cols, rows, 0, angle, mobile)?.glyph ?? " ",
    ).join(""),
  ).join("\n");
}
