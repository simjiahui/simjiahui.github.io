import test from "node:test";
import assert from "node:assert/strict";
import { moonState, lunarCalendar, phaseName } from "../src/lib/astronomy";

test("known 2024 eclipse new moon and March full moon have correct phases", () => {
  const eclipse = moonState(new Date("2024-04-08T18:21:00Z"));
  assert.ok(Math.min(eclipse.angle, 360 - eclipse.angle) < 1);
  assert.ok(eclipse.fraction < 0.001);
  assert.equal(eclipse.phase, "New moon");
  const full = moonState(new Date("2024-03-25T07:00:00Z"));
  assert.ok(Math.abs(full.angle - 180) < 1);
  assert.ok(full.fraction > 0.999);
  assert.equal(full.phase, "Full moon");
});
test("waxing and waning are distinct at the same approximate illumination", () => {
  const waxing = moonState(new Date("2024-04-15T19:13:00Z"));
  const waning = moonState(new Date("2024-04-02T03:15:00Z"));
  assert.equal(waxing.phase, "First quarter");
  assert.equal(waxing.waxing, true);
  assert.equal(waning.phase, "Last quarter");
  assert.equal(waning.waxing, false);
  assert.ok(Math.abs(waxing.fraction - waning.fraction) < 0.02);
  for (const state of [waxing, waning]) {
    assert.ok(state.altitude >= -90 && state.altitude <= 90);
    assert.ok(state.azimuth >= 0 && state.azimuth <= 360);
  }
});
test("phase naming normalizes angle wrap", () => {
  assert.equal(phaseName(360), "New moon");
  assert.equal(phaseName(-1), "New moon");
  assert.equal(phaseName(60), "Waxing crescent");
  assert.equal(phaseName(300), "Waning crescent");
});
test("Chinese calendar uses UTC+8 at midnight, not the host timezone", () => {
  const before = lunarCalendar(new Date("2024-02-09T15:59:00Z"));
  const after = lunarCalendar(new Date("2024-02-09T16:00:00Z"));
  assert.equal(before.festival, null);
  assert.equal(after.month, 1);
  assert.equal(after.day, 1);
  assert.match(after.festival!, /Lunar New Year/);
});
test("Mid-Autumn and a leap month are recognized correctly", () => {
  const autumn = lunarCalendar(new Date("2024-09-17T04:00:00Z"));
  assert.equal(autumn.month, 8);
  assert.equal(autumn.day, 15);
  assert.match(autumn.festival!, /Mid-Autumn/);
  const leap = lunarCalendar(new Date("2023-03-22T04:00:00Z"));
  assert.equal(leap.month, -2);
  assert.equal(leap.festival, null);
});
