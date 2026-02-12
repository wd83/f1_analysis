"use client";

import { useState } from "react";

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  sortValue?: (item: T) => number;
}

interface StatsTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  defaultSortKey?: string;
}

export default function StatsTable<T>({
  data,
  columns,
  title,
  defaultSortKey,
}: StatsTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey || columns[0]?.key);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return 0;
    const diff = col.sortValue(a) - col.sortValue(b);
    return sortDir === "asc" ? diff : -diff;
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <h3 className="text-lg font-bold text-f1-dark px-5 py-4 border-b">
        {title}
      </h3>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortValue && handleSort(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap ${
                    col.sortValue
                      ? "cursor-pointer hover:text-f1-red select-none"
                      : ""
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => (
              <tr
                key={idx}
                className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 whitespace-nowrap"
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p className="text-gray-400 text-center py-8">No data available</p>
        )}
      </div>
    </div>
  );
}
