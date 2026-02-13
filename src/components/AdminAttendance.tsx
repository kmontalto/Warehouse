"use client";

import { useState, useEffect } from "react";

interface EventData {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
}

interface AttendanceRecord {
  playerId: string;
  status: "present" | "absent" | "pending";
}

export default function AdminAttendance({
  events,
  players,
}: {
  events: EventData[];
  players: PlayerData[];
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load existing attendance when event is selected
  useEffect(() => {
    if (!selectedEventId) {
      setAttendance({});
      return;
    }

    setLoading(true);
    setError("");
    fetch(`/api/attendance?eventId=${selectedEventId}`)
      .then((res) => res.json())
      .then((data: AttendanceRecord[]) => {
        const map: Record<string, string> = {};
        // Initialize all players as pending
        players.forEach((p) => {
          map[p.id] = "pending";
        });
        // Override with actual data
        if (Array.isArray(data)) {
          data.forEach((record) => {
            map[record.playerId] = record.status;
          });
        }
        setAttendance(map);
      })
      .catch(() => setError("Failed to load attendance data"))
      .finally(() => setLoading(false));
  }, [selectedEventId, players]);

  const toggleStatus = (playerId: string) => {
    const current = attendance[playerId] || "pending";
    const next =
      current === "pending"
        ? "present"
        : current === "present"
        ? "absent"
        : "pending";
    setAttendance({ ...attendance, [playerId]: next });
  };

  const setAllPresent = () => {
    const newAttendance: Record<string, string> = {};
    players.forEach((p) => {
      newAttendance[p.id] = "present";
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const promises = Object.entries(attendance).map(
        ([playerId, status]) =>
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              eventId: selectedEventId,
              status,
            }),
          })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} attendance records failed to save`);
      }

      setSuccess("Attendance saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500 text-white";
      case "absent":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      default:
        return "Pending";
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div>
      {/* Event Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">
          Select Event
        </h2>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setSuccess("");
            setError("");
          }}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose an event...</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.date} - {event.title} ({event.type})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Attendance Grid */}
      {selectedEventId && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-dark">
              {selectedEvent?.title} - Attendance
            </h2>
            <button
              onClick={setAllPresent}
              className="px-3 py-1 rounded text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            >
              Mark All Present
            </button>
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm py-4">Loading attendance...</p>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {players.map((player) => {
                  const status = attendance[player.id] || "pending";
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-accent">
                            {player.jerseyNumber}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {player.firstName} {player.lastName}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleStatus(player.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors min-w-[80px] ${statusStyle(
                          status
                        )}`}
                      >
                        {statusLabel(status)}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span className="text-green-600 font-medium">
                    {Object.values(attendance).filter((s) => s === "present").length} Present
                  </span>
                  <span className="text-red-600 font-medium">
                    {Object.values(attendance).filter((s) => s === "absent").length} Absent
                  </span>
                  <span className="text-gray-500 font-medium">
                    {Object.values(attendance).filter((s) => s === "pending").length} Pending
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
