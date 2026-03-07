"use client";

import { useMemo } from "react";

interface LocationPoint {
  x: number;
  y: number;
  speed: number;
  distance: number;
}

interface TrackMapProps {
  locationData: LocationPoint[];
  hoverDistance: number | null;
}

function speedToColor(speed: number, minSpeed: number, maxSpeed: number): string {
  const t = maxSpeed > minSpeed ? (speed - minSpeed) / (maxSpeed - minSpeed) : 0.5;
  // Blue (slow) -> Green -> Yellow -> Red (fast)
  if (t < 0.33) {
    const s = t / 0.33;
    const r = Math.round(0);
    const g = Math.round(s * 200);
    const b = Math.round(255 * (1 - s));
    return `rgb(${r},${g},${b})`;
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33;
    const r = Math.round(s * 255);
    const g = Math.round(200 + s * 55);
    const b = 0;
    return `rgb(${r},${g},${b})`;
  } else {
    const s = (t - 0.66) / 0.34;
    const r = 255;
    const g = Math.round(255 * (1 - s));
    const b = 0;
    return `rgb(${r},${g},${b})`;
  }
}

export default function TrackMap({ locationData, hoverDistance }: TrackMapProps) {
  const { segments, viewBox, hoverPoint } = useMemo(() => {
    if (locationData.length < 2) {
      return { segments: [], viewBox: "0 0 100 100", hoverPoint: null };
    }

    // Find bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let minSpeed = Infinity, maxSpeed = -Infinity;
    for (const p of locationData) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (p.speed < minSpeed) minSpeed = p.speed;
      if (p.speed > maxSpeed) maxSpeed = p.speed;
    }

    const padding = 20;
    const width = maxX - minX || 100;
    const height = maxY - minY || 100;
    const vb = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;

    // Create line segments colored by speed
    const segs: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    for (let i = 0; i < locationData.length - 1; i++) {
      const p1 = locationData[i];
      const p2 = locationData[i + 1];
      const avgSpeed = (p1.speed + p2.speed) / 2;
      segs.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color: speedToColor(avgSpeed, minSpeed, maxSpeed),
      });
    }

    // Find hover point
    let hp: { x: number; y: number } | null = null;
    if (hoverDistance !== null) {
      let closest = locationData[0];
      let minDiff = Infinity;
      for (const p of locationData) {
        const diff = Math.abs(p.distance - hoverDistance);
        if (diff < minDiff) {
          minDiff = diff;
          closest = p;
        }
      }
      hp = { x: closest.x, y: closest.y };
    }

    return { segments: segs, viewBox: vb, hoverPoint: hp };
  }, [locationData, hoverDistance]);

  if (locationData.length < 2) return null;

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">Track Map</h3>
      <div className="flex justify-center">
        <svg
          viewBox={viewBox}
          className="w-full max-w-md"
          style={{ aspectRatio: "1" }}
        >
          {segments.map((seg, i) => (
            <line
              key={i}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={seg.color}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
          {hoverPoint && (
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={6}
              fill="white"
              stroke="#15151e"
              strokeWidth={2}
            />
          )}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded" style={{ backgroundColor: "rgb(0,0,255)" }} />
          Slow
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded" style={{ backgroundColor: "rgb(0,200,0)" }} />
          Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded" style={{ backgroundColor: "rgb(255,0,0)" }} />
          Fast
        </span>
      </div>
    </div>
  );
}
