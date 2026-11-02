import test from "node:test";
import assert from "node:assert/strict";
import {
  tidalEnvelope,
  springNeapStrength,
  waterField,
} from "../src/lib/tides";
import { sceneCell, staticScene } from "../src/lib/ascii";
test("tidal envelope is bounded and continuous through phase wrap", () => {
  for (let t = 0; t < 300; t += 0.5)
    for (const phase of [0, 45, 90, 180, 270, 359])
      assert.ok(Math.abs(tidalEnvelope(t, phase)) <= 0.950001);
  assert.ok(Math.abs(tidalEnvelope(10, 0) - tidalEnvelope(10, 360)) < 1e-12);
  assert.ok(Math.abs(tidalEnvelope(10, 90) - tidalEnvelope(10.001, 90)) < 0.01);
});
test("spring-neap forcing is strongest at new and full moon", () => {
  assert.equal(springNeapStrength(0), 1);
  assert.equal(springNeapStrength(180), 1);
  assert.equal(springNeapStrength(90), 0);
  assert.equal(springNeapStrength(270), 0);
  assert.ok(Math.abs(tidalEnvelope(0, 0)) > Math.abs(tidalEnvelope(0, 90)));
});
test("water propagates in both time and space without discontinuities", () => {
  assert.notEqual(waterField(0.2, 0.4, 0, 90), waterField(0.2, 0.4, 1, 90));
  assert.notEqual(waterField(0.2, 0.4, 0, 90), waterField(0.3, 0.4, 0, 90));
  for (let x = 0; x <= 1; x += 0.02)
    for (let y = 0; y <= 1; y += 0.02) {
      const value = waterField(x, y, 100, 180);
      assert.ok(Number.isFinite(value));
      assert.ok(Math.abs(value) <= 0.920001);
    }
});
test("ASCII fallback is detailed and phase controls disc brightness", () => {
  const frame = staticScene(180);
  assert.equal(staticScene(180, true).split("\n")[0]!.length, 52);
  assert.equal(frame.split("\n").length, 65);
  assert.ok(new Set(frame).size > 15);
  let full = 0,
    newMoon = 0;
  for (let r = 0; r < 38; r++)
    for (let c = 80; c < 150; c++) {
      const a = sceneCell(c, r, 156, 65, 0, 180),
        b = sceneCell(c, r, 156, 65, 0, 0);
      if (a?.tone === "moon") full += a.alpha;
      if (b?.tone === "moon") newMoon += b.alpha;
    }
  assert.ok(full > newMoon * 1.3);
});
