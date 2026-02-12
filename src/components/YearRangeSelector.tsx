"use client";

interface YearRangeSelectorProps {
  startYear: number;
  endYear: number;
  onStartYearChange: (year: number) => void;
  onEndYearChange: (year: number) => void;
  onApply: () => void;
  loading: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

export default function YearRangeSelector({
  startYear,
  endYear,
  onStartYearChange,
  onEndYearChange,
  onApply,
  loading,
}: YearRangeSelectorProps) {
  const years = Array.from(
    { length: CURRENT_YEAR - MIN_YEAR + 1 },
    (_, i) => CURRENT_YEAR - i
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          From
        </label>
        <select
          value={startYear}
          onChange={(e) => onStartYearChange(parseInt(e.target.value))}
          className="px-3 py-2 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-f1-red"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          To
        </label>
        <select
          value={endYear}
          onChange={(e) => onEndYearChange(parseInt(e.target.value))}
          className="px-3 py-2 rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-f1-red"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onApply}
        disabled={loading || startYear > endYear}
        className="px-5 py-2 bg-f1-red text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Loading..." : "Analyze"}
      </button>
    </div>
  );
}
