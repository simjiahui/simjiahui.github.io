import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  SiderealTime,
} from "astronomy-engine";
import { Solar } from "lunar-javascript";
export const REFERENCE = {
  name: "Sendai, Japan",
  latitude: 38.2682,
  longitude: 140.8694,
  elevation: 0,
};
export const CALENDAR_ZONE = "Asia/Shanghai";
export const festivals = [
  { month: 1, day: 1, label: "Lunar New Year · 春节" },
  { month: 8, day: 15, label: "Mid-Autumn Festival · 中秋节" },
];
export function phaseName(angle: number) {
  const phase = ((angle % 360) + 360) % 360;
  if (phase < 5 || phase >= 355) return "New moon";
  if (phase < 85) return "Waxing crescent";
  if (phase <= 95) return "First quarter";
  if (phase < 175) return "Waxing gibbous";
  if (phase <= 185) return "Full moon";
  if (phase < 265) return "Waning gibbous";
  if (phase <= 275) return "Last quarter";
  return "Waning crescent";
}
export function lunarCalendar(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CALENDAR_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const lunar = Solar.fromYmd(get("year"), get("month"), get("day")).getLunar();
  const month = lunar.getMonth();
  return {
    year: lunar.getYear(),
    month,
    day: lunar.getDay(),
    label: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    festival:
      festivals.find((f) => f.month === month && f.day === lunar.getDay())
        ?.label ?? null,
  };
}
export function moonState(date = new Date()) {
  const angle = MoonPhase(date);
  const observer = new Observer(
    REFERENCE.latitude,
    REFERENCE.longitude,
    REFERENCE.elevation,
  );
  const equatorial = Equator(Body.Moon, date, observer, true, true);
  const solar = Equator(Body.Sun, date, observer, true, true);
  const sidereal = SiderealTime(date) + REFERENCE.longitude / 15;
  const radians = Math.PI / 180;
  const horizon = Horizon(
    date,
    observer,
    equatorial.ra,
    equatorial.dec,
    "normal",
  );
  return {
    date: date.toISOString(),
    angle,
    fraction: Illumination(Body.Moon, date).phase_fraction,
    phase: phaseName(angle),
    waxing: angle < 180,
    altitude: horizon.altitude,
    azimuth: horizon.azimuth,
    calendar: lunarCalendar(date),
    forcing: {
      latitude: REFERENCE.latitude * radians,
      lunarDeclination: equatorial.dec * radians,
      solarDeclination: solar.dec * radians,
      lunarHourAngle: (sidereal - equatorial.ra) * 15 * radians,
      solarHourAngle: (sidereal - solar.ra) * 15 * radians,
      lunarDistance: equatorial.dist,
      solarDistance: solar.dist,
    },
  };
}
export type MoonState = ReturnType<typeof moonState>;
