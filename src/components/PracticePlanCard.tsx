"use client";

import { useState } from "react";
import { format } from "date-fns";

interface DrillData {
  id: string;
  order: number;
  drill: {
    id: string;
    name: string;
    duration: number;
    skillFocus: string;
    description: string | null;
  };
}

interface PracticePlanData {
  id: string;
  date: string;
  title: string;
  focus: string | null;
  notes: string | null;
  drills: DrillData[];
}

export default function PracticePlanCard({ plan }: { plan: PracticePlanData }) {
  const [expanded, setExpanded] = useState(false);

  const totalDuration = plan.drills.reduce(
    (sum, d) => sum + d.drill.duration,
    0
  );

  const focusBadgeColor = (focus: string | null) => {
    switch (focus) {
      case "Hitting":
        return "bg-orange-100 text-orange-800";
      case "Fielding":
        return "bg-blue-100 text-blue-800";
      case "Pitching":
        return "bg-red-100 text-red-800";
      case "General":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const skillBadgeColor = (skill: string) => {
    switch (skill) {
      case "Hitting":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Fielding":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Pitching":
        return "bg-red-50 text-red-700 border-red-200";
      case "Baserunning":
        return "bg-green-50 text-green-700 border-green-200";
      case "Conditioning":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-slate-800">{plan.title}</span>
              {plan.focus && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${focusBadgeColor(
                    plan.focus
                  )}`}
                >
                  {plan.focus}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>{format(new Date(plan.date), "EEE, MMM d, yyyy")}</span>
              <span>{plan.drills.length} drills</span>
              <span>{totalDuration} min total</span>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 pb-4">
          {plan.notes && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              {plan.notes}
            </div>
          )}

          {plan.drills.length === 0 ? (
            <p className="mt-3 text-slate-400 text-sm">
              No drills added to this plan yet.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {plan.drills.map((pd) => (
                <div
                  key={pd.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {pd.order}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-800">
                        {pd.drill.name}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${skillBadgeColor(
                          pd.drill.skillFocus
                        )}`}
                      >
                        {pd.drill.skillFocus}
                      </span>
                    </div>
                    {pd.drill.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {pd.drill.description}
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-500 flex-shrink-0">
                    {pd.drill.duration} min
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                <span className="text-sm font-semibold text-slate-700">
                  Total Duration
                </span>
                <span className="text-sm font-bold text-primary-dark">
                  {totalDuration} minutes
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
