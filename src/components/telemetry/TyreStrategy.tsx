"use client";

interface Stint {
  driver_number: number;
  stint_number: number;
  compound: string;
  tyre_age_at_start: number;
  lap_start: number;
  lap_end: number;
}

interface DriverInfo {
  driver_number: number;
  name_acronym: string;
  team_colour: string;
}

interface TyreStrategyProps {
  stints: Stint[];
  drivers: DriverInfo[];
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#e10600",
  MEDIUM: "#ffd700",
  HARD: "#cccccc",
  INTERMEDIATE: "#43b02a",
  WET: "#0072c6",
  UNKNOWN: "#888888",
};

export default function TyreStrategy({ stints, drivers }: TyreStrategyProps) {
  if (stints.length === 0) return null;

  // Group stints by driver
  const stintsByDriver = new Map<number, Stint[]>();
  for (const stint of stints) {
    if (!stintsByDriver.has(stint.driver_number)) {
      stintsByDriver.set(stint.driver_number, []);
    }
    stintsByDriver.get(stint.driver_number)!.push(stint);
  }

  // Find max lap for scale
  let maxLap = 0;
  for (const stint of stints) {
    if (stint.lap_end > maxLap) maxLap = stint.lap_end;
  }
  if (maxLap === 0) maxLap = 60;

  // Sort drivers by their order in the drivers array
  const driverOrder = drivers
    .filter((d) => stintsByDriver.has(d.driver_number))
    .map((d) => d.driver_number);

  // Add any drivers with stints not in the drivers list
  for (const dn of stintsByDriver.keys()) {
    if (!driverOrder.includes(dn)) driverOrder.push(dn);
  }

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">Tyre Strategy</h3>
      <div className="space-y-1.5">
        {driverOrder.map((dn) => {
          const driverStints = stintsByDriver.get(dn) || [];
          const driver = driverMap.get(dn);
          const acronym = driver?.name_acronym || `#${dn}`;

          return (
            <div key={dn} className="flex items-center gap-2">
              <span className="text-xs font-mono w-10 text-right text-gray-600">
                {acronym}
              </span>
              <div className="flex-1 h-6 relative bg-gray-100 rounded overflow-hidden">
                {driverStints
                  .sort((a, b) => a.lap_start - b.lap_start)
                  .map((stint, i) => {
                    const left = (stint.lap_start / maxLap) * 100;
                    const width =
                      ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100;
                    const color =
                      COMPOUND_COLORS[stint.compound?.toUpperCase()] ||
                      COMPOUND_COLORS.UNKNOWN;

                    return (
                      <div
                        key={i}
                        className="absolute top-0 h-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: color,
                          color:
                            stint.compound?.toUpperCase() === "MEDIUM"
                              ? "#000"
                              : "#fff",
                        }}
                        title={`${stint.compound} - Laps ${stint.lap_start}-${stint.lap_end} (Age: ${stint.tyre_age_at_start})`}
                      >
                        {width > 8 ? stint.compound?.[0] : ""}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {Object.entries(COMPOUND_COLORS)
          .filter(([k]) => k !== "UNKNOWN")
          .map(([compound, color]) => (
            <div key={compound} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{compound.toLowerCase()}</span>
            </div>
          ))}
      </div>
      {/* Lap scale */}
      <div className="flex justify-between text-xs text-gray-400 mt-1 ml-12">
        <span>Lap 1</span>
        <span>Lap {maxLap}</span>
      </div>
    </div>
  );
}
