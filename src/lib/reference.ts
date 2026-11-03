import referenceLocation from "../data/referenceLocation.json";

/** Decimal degrees (east-positive longitude), elevation in metres. */
export interface ReferenceLocation {
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly elevation: number;
}

export const REFERENCE: ReferenceLocation = Object.freeze(referenceLocation);

export function referenceVariables(location: ReferenceLocation = REFERENCE) {
  const latitude = `${Math.abs(location.latitude).toFixed(4)}° ${location.latitude < 0 ? "S" : "N"}`;
  const longitude = `${Math.abs(location.longitude).toFixed(4)}° ${location.longitude < 0 ? "W" : "E"}`;
  return {
    referenceName: location.name,
    referenceLatitude: latitude,
    referenceLongitude: longitude,
    referenceElevation: location.elevation,
  };
}
