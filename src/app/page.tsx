"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    locality: string;
    country: string;
  };
}

export default function Home() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/circuits")
      .then((res) => res.json())
      .then((data) => {
        setCircuits(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = circuits.filter(
    (c) =>
      c.circuitName.toLowerCase().includes(search.toLowerCase()) ||
      c.Location.country.toLowerCase().includes(search.toLowerCase()) ||
      c.Location.locality.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-f1-dark mb-2">
          Select a Circuit
        </h2>
        <p className="text-gray-600">
          Choose a track to see which drivers and teams have dominated there
          throughout F1 history.
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search circuits by name, city, or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-lg px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-f1-red focus:border-transparent text-lg"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-f1-red border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((circuit) => (
            <button
              key={circuit.circuitId}
              onClick={() => router.push(`/track/${circuit.circuitId}`)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-5 text-left border-l-4 border-transparent hover:border-f1-red group"
            >
              <h3 className="font-bold text-lg text-f1-dark group-hover:text-f1-red transition-colors">
                {circuit.circuitName}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {circuit.Location.locality}, {circuit.Location.country}
              </p>
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-gray-500 col-span-full text-center py-10">
              No circuits found matching &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
