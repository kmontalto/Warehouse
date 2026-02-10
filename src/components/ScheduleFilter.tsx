"use client";

import { useState } from "react";
import { format } from "date-fns";

interface EventData {
  id: string;
  type: string;
  title: string;
  date: string;
  time: string;
  location: string;
  fieldName: string | null;
  opponent: string | null;
  homeAway: string | null;
  result: string | null;
  notes: string | null;
}

type FilterType = "all" | "game" | "practice" | "tournament";

export default function ScheduleFilter({ events }: { events: EventData[] }) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  // Group events by month
  const grouped: Record<string, EventData[]> = {};
  filtered.forEach((event) => {
    const monthKey = format(new Date(event.date), "MMMM yyyy");
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(event);
  });

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "game", label: "Games" },
    { key: "practice", label: "Practices" },
    { key: "tournament", label: "Tournaments" },
  ];

  const typeBadge = (type: string) => {
    switch (type) {
      case "game":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Game
          </span>
        );
      case "practice":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Practice
          </span>
        );
      case "tournament":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Tournament
          </span>
        );
      default:
        return null;
    }
  };

  const resultDisplay = (result: string | null) => {
    if (!result) return null;
    const r = result.trim().toUpperCase();
    const colorClass = r.startsWith("W")
      ? "text-green-600 bg-green-50 border-green-200"
      : r.startsWith("L")
      ? "text-red-600 bg-red-50 border-red-200"
      : "text-gray-600 bg-gray-50 border-gray-200";
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold border ${colorClass}`}
      >
        {result}
      </span>
    );
  };

  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400">No events found.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthEvents]) => (
          <div key={month} className="mb-8">
            <h2 className="text-lg font-bold text-blue-900 mb-3 border-b border-slate-200 pb-2">
              {month}
            </h2>
            <div className="space-y-3">
              {monthEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow ${
                    isPast(event.date) ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        {typeBadge(event.type)}
                        <span className="font-semibold text-slate-800">
                          {event.title}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {format(new Date(event.date), "EEE, MMM d")} at{" "}
                            {event.time}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>
                            {event.location}
                            {event.fieldName && ` - ${event.fieldName}`}
                          </span>
                        </div>
                      </div>
                      {event.opponent && (
                        <div className="text-sm text-slate-600 mt-1">
                          vs {event.opponent}
                          {event.homeAway && (
                            <span className="text-slate-400 ml-1">
                              ({event.homeAway})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {event.type === "game" &&
                        isPast(event.date) &&
                        resultDisplay(event.result)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
