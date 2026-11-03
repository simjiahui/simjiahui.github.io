import test from "node:test";
import assert from "node:assert/strict";
import { moonState, CALENDAR_ZONE } from "../src/lib/astronomy";
import { REFERENCE, referenceVariables } from "../src/lib/reference";
import { tidalEnvelope } from "../src/lib/tides";
import { siteContent, text } from "../src/data/siteContent";

const elsewhere = {
  name: "Wellington, New Zealand",
  latitude: -41.2866,
  longitude: 174.7756,
  elevation: 120,
};

test("reference coordinates use absolute degrees and the correct hemispheres", () => {
  assert.deepEqual(referenceVariables(elsewhere), {
    referenceName: "Wellington, New Zealand",
    referenceLatitude: "41.2866° S",
    referenceLongitude: "174.7756° E",
    referenceElevation: 120,
  });
  assert.equal(
    referenceVariables({ ...elsewhere, longitude: -73.5673 })
      .referenceLongitude,
    "73.5673° W",
  );
  const zero = referenceVariables({ ...elsewhere, latitude: 0, longitude: 0 });
  assert.equal(zero.referenceLatitude, "0.0000° N");
  assert.equal(zero.referenceLongitude, "0.0000° E");
});

test("reference copy derives from the same observer as the default calculations", () => {
  const labels = referenceVariables();
  const coordinates = text(siteContent.hero.coordinates);
  assert.ok(coordinates.includes(labels.referenceLatitude));
  assert.ok(coordinates.includes(labels.referenceLongitude));
  for (const copy of [
    siteContent.hero.observation.reference,
    siteContent.colophon.astronomyParagraph,
    siteContent.colophon.motionParagraph,
  ]) {
    assert.ok(text(copy).includes(REFERENCE.name));
    const changed = text(copy, referenceVariables(elsewhere));
    assert.ok(changed.includes(elsewhere.name));
    assert.ok(!changed.includes(REFERENCE.name));
  }
  assert.ok(
    text(
      siteContent.colophon.astronomyParagraph,
      referenceVariables(elsewhere),
    ).includes("elevation 120 m"),
  );
});

test("changing the observer updates lunar and tidal geometry but preserves phase and UTC+8 calendar", () => {
  assert.equal(CALENDAR_ZONE, "Asia/Shanghai");
  for (const instant of ["2024-02-09T15:59:00Z", "2024-02-09T16:00:00Z"]) {
    const date = new Date(instant);
    const original = moonState(date);
    assert.deepEqual(original, moonState(date, REFERENCE));
    for (const reference of [
      { ...REFERENCE, latitude: elsewhere.latitude },
      { ...REFERENCE, longitude: -73.5673 },
      { ...REFERENCE, elevation: 3000 },
      elsewhere,
    ]) {
      const changed = moonState(date, reference);
      assert.notEqual(changed.altitude, original.altitude);
      assert.notEqual(changed.azimuth, original.azimuth);
      assert.notDeepEqual(changed.forcing, original.forcing);
      assert.ok(
        Math.abs(
          changed.forcing.latitude - (reference.latitude * Math.PI) / 180,
        ) < 1e-12,
      );
      assert.notEqual(
        tidalEnvelope(0, changed.forcing),
        tidalEnvelope(0, original.forcing),
      );
      assert.equal(changed.angle, original.angle);
      assert.equal(changed.fraction, original.fraction);
      assert.deepEqual(changed.calendar, original.calendar);
      assert.equal(changed.calendar.day, instant.includes("15:59") ? 30 : 1);
    }
  }
});
