export type CountryCode = "CL" | "PE" | "CO";

export type Country = {
  code: CountryCode;
  isoNumeric: string; // id en world-atlas
  name: string;
  city: string;
  lat: number;
  lon: number;
  /** punto hacia el que gira el globo al enfocar el país */
  view: [lat: number, lon: number];
  timeZone: string;
};

export const COUNTRIES: Country[] = [
  {
    code: "CL",
    isoNumeric: "152",
    name: "Chile",
    city: "Santiago",
    lat: -33.45,
    lon: -70.66,
    view: [-30, -71],
    timeZone: "America/Santiago",
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
];
