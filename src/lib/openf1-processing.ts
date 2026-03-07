import type { OpenF1CarData, OpenF1Location } from "./openf1";

export interface ProcessedCarData {
  distance: number; // normalized 0-100
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  drs: number;
  rpm: number;
}

export interface ProcessedLocation {
  x: number;
  y: number;
  speed: number;
  distance: number; // normalized 0-100
}

// Nth-point downsampling for multi-channel telemetry data
function nthPointDownsample<T>(data: T[], targetCount: number): T[] {
  if (data.length <= targetCount) return data;
  const step = data.length / targetCount;
  const result: T[] = [];
  for (let i = 0; i < targetCount; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  // Always include last point
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
}

// Integrate speed over time to get cumulative distance, then normalize to 0-100%
export function processCarData(
  rawData: OpenF1CarData[],
  targetPoints: number = 400
): ProcessedCarData[] {
  if (rawData.length === 0) return [];

  // Sort by timestamp
  const sorted = [...rawData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Compute cumulative distance by integrating speed over time
  let totalDistance = 0;
  const withDistance: (OpenF1CarData & { cumDist: number })[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const dt =
        (new Date(sorted[i].date).getTime() -
          new Date(sorted[i - 1].date).getTime()) /
        1000; // seconds
      const avgSpeed = (sorted[i].speed + sorted[i - 1].speed) / 2; // km/h
      totalDistance += (avgSpeed * dt) / 3.6; // meters
    }
    withDistance.push({ ...sorted[i], cumDist: totalDistance });
  }

  // Normalize distance to 0-100%
  const maxDist = totalDistance || 1;
  const processed: ProcessedCarData[] = withDistance.map((d) => ({
    distance: (d.cumDist / maxDist) * 100,
    speed: d.speed,
    throttle: d.throttle,
    brake: d.brake, // 0-100 from API
    gear: d.n_gear,
    drs: d.drs,
    rpm: d.rpm,
  }));

  return nthPointDownsample(processed, targetPoints);
}

export function processLocationData(
  locationData: OpenF1Location[],
  carData: OpenF1CarData[],
  targetPoints: number = 300
): ProcessedLocation[] {
  if (locationData.length === 0) return [];

  const sorted = [...locationData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Build a speed lookup from car data (nearest timestamp)
  const speedByTime = new Map<number, number>();
  for (const cd of carData) {
    speedByTime.set(new Date(cd.date).getTime(), cd.speed);
  }

  // Compute cumulative distance
  let totalDist = 0;
  const withDist: { x: number; y: number; speed: number; cumDist: number }[] =
    [];

  for (let i = 0; i < sorted.length; i++) {
    const ts = new Date(sorted[i].date).getTime();
    // Find nearest speed
    let speed = 0;
    let minTimeDiff = Infinity;
    for (const [t, s] of speedByTime) {
      const diff = Math.abs(t - ts);
      if (diff < minTimeDiff) {
        minTimeDiff = diff;
        speed = s;
      }
      if (diff > 5000) break; // stop searching if we're too far
    }

    if (i > 0) {
      const dx = sorted[i].x - sorted[i - 1].x;
      const dy = sorted[i].y - sorted[i - 1].y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    withDist.push({
      x: sorted[i].x,
      y: sorted[i].y,
      speed,
      cumDist: totalDist,
    });
  }

  const maxDist = totalDist || 1;
  const processed: ProcessedLocation[] = withDist.map((d) => ({
    x: d.x,
    y: d.y,
    speed: d.speed,
    distance: (d.cumDist / maxDist) * 100,
  }));

  return nthPointDownsample(processed, targetPoints);
}
