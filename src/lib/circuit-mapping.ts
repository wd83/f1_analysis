// Maps Ergast circuitId to OpenF1 country_name for meeting lookup.
// OpenF1 meetings can be matched by country_name + year.

const CIRCUIT_TO_COUNTRY: Record<string, string> = {
  albert_park: "Australia",
  americas: "United States",
  bahrain: "Bahrain",
  baku: "Azerbaijan",
  catalunya: "Spain",
  hungaroring: "Hungary",
  imola: "Italy",
  interlagos: "Brazil",
  jeddah: "Saudi Arabia",
  losail: "Qatar",
  marina_bay: "Singapore",
  miami: "United States",
  monaco: "Monaco",
  monza: "Italy",
  red_bull_ring: "Austria",
  rodriguez: "Mexico",
  shanghai: "China",
  silverstone: "Great Britain",
  spa: "Belgium",
  suzuka: "Japan",
  vegas: "United States",
  villeneuve: "Canada",
  yas_marina: "United Arab Emirates",
  zandvoort: "Netherlands",
};

// For countries with multiple circuits (US, Italy), use meeting name disambiguation
const CIRCUIT_TO_MEETING_HINT: Record<string, string> = {
  americas: "United States",
  miami: "Miami",
  vegas: "Las Vegas",
  monza: "Italian",
  imola: "Emilia",
};

export function getCountryForCircuit(circuitId: string): string | null {
  return CIRCUIT_TO_COUNTRY[circuitId] ?? null;
}

export function getMeetingHint(circuitId: string): string | null {
  return CIRCUIT_TO_MEETING_HINT[circuitId] ?? null;
}

export function isOpenF1Available(circuitId: string): boolean {
  return circuitId in CIRCUIT_TO_COUNTRY;
}
