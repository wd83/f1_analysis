"use client";

interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
}

interface SessionSelectorProps {
  sessions: Session[];
  selectedKey: number | null;
  onSelect: (key: number) => void;
}

const SESSION_ORDER = ["Practice 1", "Practice 2", "Practice 3", "Sprint Qualifying", "Sprint", "Qualifying", "Race"];

export default function SessionSelector({
  sessions,
  selectedKey,
  onSelect,
}: SessionSelectorProps) {
  const sorted = [...sessions].sort(
    (a, b) =>
      SESSION_ORDER.indexOf(a.session_name) -
      SESSION_ORDER.indexOf(b.session_name)
  );

  const SHORT_NAMES: Record<string, string> = {
    "Practice 1": "FP1",
    "Practice 2": "FP2",
    "Practice 3": "FP3",
    "Sprint Qualifying": "SQ",
    Sprint: "Sprint",
    Qualifying: "Q",
    Race: "Race",
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {sorted.map((s) => (
        <button
          key={s.session_key}
          onClick={() => onSelect(s.session_key)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            selectedKey === s.session_key
              ? "bg-f1-red text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          {SHORT_NAMES[s.session_name] || s.session_name}
        </button>
      ))}
    </div>
  );
}
