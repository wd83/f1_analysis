"use client";

interface WeatherData {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  wind_direction: number;
}

interface WeatherBarProps {
  weather: WeatherData | null;
}

export default function WeatherBar({ weather }: WeatherBarProps) {
  if (!weather) return null;

  return (
    <div className="flex gap-4 flex-wrap text-xs text-gray-600 bg-white rounded-lg shadow px-4 py-2">
      <span title="Air temperature">
        Air: {weather.air_temperature.toFixed(1)}°C
      </span>
      <span title="Track temperature">
        Track: {weather.track_temperature.toFixed(1)}°C
      </span>
      <span title="Humidity">
        Humidity: {weather.humidity.toFixed(0)}%
      </span>
      <span title="Wind">
        Wind: {weather.wind_speed.toFixed(1)} m/s
      </span>
      {weather.rainfall > 0 && (
        <span className="text-blue-600 font-medium" title="Rainfall detected">
          Rain
        </span>
      )}
    </div>
  );
}
