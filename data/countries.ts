/**
 * Países destacados en el globo.
 */
type CountryInput = {
  code: string;
  isoNumeric: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  view: readonly [lat: number, lon: number];
  timeZone: string;
  hq?: boolean;
};

const LIST = [
  {
    code: "CL",
    isoNumeric: "152",
    name: "Chile",
    city: "Santiago",
    lat: -33.45,
    lon: -70.66,
    view: [-30, -71],
    timeZone: "America/Santiago",
    hq: true,
  },
  {
    code: "PE",
    isoNumeric: "604",
    name: "Perú",
    city: "Lima",
    lat: -12.05,
    lon: -77.04,
    view: [-10, -75],
    timeZone: "America/Lima",
  },
  {
    code: "CO",
    isoNumeric: "170",
    name: "Colombia",
    city: "Bogotá",
    lat: 4.71,
    lon: -74.07,
    view: [4, -73],
    timeZone: "America/Bogota",
  },
] as const satisfies readonly CountryInput[];

/** Código de cualquier país de la lista (se deriva solo de la lista). */
export type CountryCode = (typeof LIST)[number]["code"];

export type Country = Omit<CountryInput, "code"> & { code: CountryCode };

export const COUNTRIES: readonly Country[] = LIST;
