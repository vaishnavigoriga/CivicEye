const EARTH_RADIUS_M = 6371008.8;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres between two lat/lng points (Haversine formula). */
export const haversineMetres = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** Rough bounding box for the Greater Hyderabad region. Reports outside it are rejected. */
export const HYDERABAD_BOUNDS = { minLat: 17.15, maxLat: 17.75, minLng: 78.15, maxLng: 78.8 };

export const isInHyderabad = (lat: number, lng: number): boolean =>
  lat >= HYDERABAD_BOUNDS.minLat && lat <= HYDERABAD_BOUNDS.maxLat && lng >= HYDERABAD_BOUNDS.minLng && lng <= HYDERABAD_BOUNDS.maxLng;

/** Approximate locality centres. Used only to suggest a locality NAME for a point, never as a location. */
export const AREA_CENTRES: Record<string, [number, number]> = {
  'Banjara Hills': [17.4156, 78.4347],
  'Jubilee Hills': [17.4328, 78.4071],
  Madhapur: [17.4504, 78.39],
  'Hitech City': [17.4486, 78.3806],
  Kukatpally: [17.4849, 78.4138],
  Secunderabad: [17.4399, 78.4983],
  Charminar: [17.3616, 78.4747],
  Begumpet: [17.4418, 78.4636],
  Ameerpet: [17.4374, 78.4487],
  'LB Nagar': [17.3463, 78.5522],
};

export const nearestArea = (lat: number, lng: number): string =>
  Object.entries(AREA_CENTRES).sort(
    (a, b) => haversineMetres(lat, lng, a[1][0], a[1][1]) - haversineMetres(lat, lng, b[1][0], b[1][1]),
  )[0][0];
