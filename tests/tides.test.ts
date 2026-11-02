import test from "node:test";
import assert from "node:assert/strict";
import {
  tidalEnvelope,
  springNeapStrength,
  waterField,
} from "../src/lib/tides";
import {
  cellGlyph,
  cellShade,
  cellTone,
  createScene,
  lunarLight,
  skyCell,
  staticScene,
  waterCell,
  waterFrame,
} from "../src/lib/ascii";
import { equilibriumPotential } from "../src/lib/tides";
import { moonState } from "../src/lib/astronomy";
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
test("dense desktop and mobile snapshots preserve detail and lunar phase", () => {
  const frame = staticScene(180);
  assert.equal(frame.split("\n").length, 84);
  assert.equal(frame.split("\n")[0]!.length, 196);
  assert.equal(staticScene(180, true).split("\n")[0]!.length, 64);
  assert.ok(new Set(frame).size > 12);
  let full = 0,
    dark = 0;
  const a = createScene(1440, 918, 8.5, 180),
    b = createScene(1440, 918, 8.5, 0);
  for (let r = 0; r < a.rows * 0.5; r++)
    for (let c = 0; c < a.cols; c++) {
      const lit = skyCell(a, c, r),
        unlit = skyCell(b, c, r);
      if (cellTone(lit) === 1) full += cellShade(lit);
      if (cellTone(unlit) === 1) dark += cellShade(unlit);
    }
  assert.ok(full > dark * 8);
  assert.ok(a.cols > 280); // Former renderer was ~184 columns at this viewport.
});
test("lunar lighting reproduces physical illuminated area and waxing orientation", () => {
  for (const fraction of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const light = lunarLight(90, fraction);
    let visible = 0,
      illuminated = 0;
    for (let y = -0.995; y < 1; y += 0.01)
      for (let x = -0.995; x < 1; x += 0.01)
        if (x * x + y * y < 1) {
          visible++;
          if (x * light.x + Math.sqrt(1 - x * x - y * y) * light.z > 0)
            illuminated++;
        }
    assert.ok(Math.abs(illuminated / visible - fraction) < 0.012);
  }
  assert.ok(lunarLight(90, 0.5).x > 0);
  assert.ok(lunarLight(270, 0.5).x < 0);
});
test("equilibrium forcing depends on real declination, hour angle, and inverse-cube distance", () => {
  assert.equal(equilibriumPotential(0, 0, 0), 1);
  assert.equal(equilibriumPotential(0, 0, Math.PI / 2), -0.5);
  const geometry = moonState(new Date("2024-04-08T18:21:00Z")).forcing;
  const base = tidalEnvelope(0, geometry);
  assert.notEqual(
    base,
    tidalEnvelope(0, {
      ...geometry,
      lunarDeclination: geometry.lunarDeclination + 0.3,
    }),
  );
  assert.notEqual(
    base,
    tidalEnvelope(0, {
      ...geometry,
      lunarHourAngle: geometry.lunarHourAngle + 0.5,
    }),
  );
  assert.notEqual(
    base,
    tidalEnvelope(0, {
      ...geometry,
      lunarDistance: geometry.lunarDistance * 1.1,
    }),
  );
  assert.ok(
    Math.abs(tidalEnvelope(0, geometry) - tidalEnvelope(0.001, geometry)) <
      0.001,
  );
  assert.notEqual(tidalEnvelope(0, geometry), tidalEnvelope(20, geometry));
});
test("new moon does not produce the full moon's reflection corridor", () => {
  const full = createScene(1440, 918, 10, 180),
    dark = createScene(1440, 918, 10, 0);
  const litFrame = waterFrame(full, 8),
    darkFrame = waterFrame(dark, 8);
  const sample = { height: 0, slopeX: 0, slopeZ: 0, ripple: 0 };
  let reflectedFull = 0,
    reflectedDark = 0;
  for (let r = Math.ceil(full.rows * 0.56); r < full.rows; r++)
    for (let c = Math.floor(full.cols * 0.63); c < full.cols * 0.9; c++) {
      const lit = waterCell(full, litFrame, c, r, sample),
        unlit = waterCell(dark, darkFrame, c, r, sample);
      if (cellTone(lit) === 1) reflectedFull += cellShade(lit);
      if (cellTone(unlit) === 1) reflectedDark += cellShade(unlit);
      assert.ok(cellGlyph(lit).length === 1);
    }
  assert.ok(reflectedFull > 100);
  assert.equal(reflectedDark, 0);
});
