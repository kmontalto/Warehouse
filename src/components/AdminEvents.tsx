"use client";

import { useState } from "react";

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

const emptyForm = {
  type: "game",
  title: "",
  date: "",
  time: "",
  location: "",
  fieldName: "",
  opponent: "",
  homeAway: "home",
  result: "",
  notes: "",
};

export default function AdminEvents({
  initialEvents,
}: {
  initialEvents: EventData[];
}) {
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncUrl, setSyncUrl] = useState("");
  const [syncing, setSyncing] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        type: form.type,
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        fieldName: form.fieldName || null,
        opponent: form.type === "game" ? form.opponent || null : null,
        homeAway: form.type === "game" ? form.homeAway || null : null,
        result: form.result || null,
        notes: form.notes || null,
      };

      if (editingId) {
        const res = await fetch(`/api/events/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update event");
        }
        const updated = await res.json();
        setEvents(
          events.map((ev) =>
            ev.id === editingId
              ? {
                  ...updated,
                  date: updated.date.split("T")[0],
                }
              : ev
          )
        );
        setSuccess("Event updated successfully!");
        setEditingId(null);
      } else {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create event");
        }
        const created = await res.json();
        setEvents([
          { ...created, date: created.date.split("T")[0] },
          ...events,
        ]);
        setSuccess("Event created successfully!");
      }
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: EventData) => {
    setEditingId(event.id);
    setForm({
      type: event.type,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      fieldName: event.fieldName || "",
      opponent: event.opponent || "",
      homeAway: event.homeAway || "home",
      result: event.result || "",
      notes: event.notes || "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents(events.filter((e) => e.id !== id));
      setSuccess("Event deleted successfully!");
    } catch {
      setError("Failed to delete event");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSync = async () => {
    if (!syncUrl.trim()) {
      setError("Please enter a GameChanger schedule URL");
      return;
    }
    setError("");
    setSuccess("");
    setSyncing(true);
    try {
      const res = await fetch("/api/events/sync-gamechanger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: syncUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }
      const { summary } = data;
      setSuccess(
        `Sync complete! ${summary.created} created, ${summary.updated} updated, ${summary.skipped} unchanged out of ${summary.total} events.`
      );
      // Refresh events list
      const eventsRes = await fetch("/api/events");
      if (eventsRes.ok) {
        const refreshed = await eventsRes.json();
        setEvents(
          refreshed.map((ev: EventData & { date: string }) => ({
            ...ev,
            date: ev.date.split("T")[0],
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case "game":
        return "bg-blue-100 text-blue-800";
      case "practice":
        return "bg-green-100 text-green-800";
      case "tournament":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      {/* GameChanger Sync */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">
          Sync from GameChanger
        </h2>
        <p className="text-sm text-slate-500 mb-3">
          Import your schedule from GameChanger. Existing events will be matched by date and opponent to avoid duplicates.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={syncUrl}
            onChange={(e) => setSyncUrl(e.target.value)}
            placeholder="https://web.gc.com/teams/.../schedule"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {syncing ? "Syncing..." : "Sync Schedule"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">
          {editingId ? "Edit Event" : "Create New Event"}
        </h2>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="game">Game</option>
                <option value="practice">Practice</option>
                <option value="tournament">Tournament</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Game vs Tigers"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time
              </label>
              <input
                name="time"
                value={form.time}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 6:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., City Park"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Field Name
              </label>
              <input
                name="fieldName"
                value={form.fieldName}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Field 3"
              />
            </div>
          </div>

          {/* Game-specific fields */}
          {form.type === "game" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Opponent
                </label>
                <input
                  name="opponent"
                  value={form.opponent}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Tigers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Home/Away
                </label>
                <select
                  name="homeAway"
                  value={form.homeAway}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Result
                </label>
                <input
                  name="result"
                  value={form.result}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., W 8-3"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary transition-colors disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Event"
                : "Create Event"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">
          All Events ({events.length})
        </h2>
        {events.length === 0 ? (
          <p className="text-slate-400 text-sm">No events yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border border-slate-100 rounded-lg hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge(
                        event.type
                      )}`}
                    >
                      {event.type}
                    </span>
                    <span className="font-medium text-sm text-slate-800">
                      {event.title}
                    </span>
                    {event.result && (
                      <span
                        className={`text-xs font-bold ${
                          event.result.trim().toUpperCase().startsWith("W")
                            ? "text-green-600"
                            : event.result.trim().toUpperCase().startsWith("L")
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {event.result}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {event.date} at {event.time} | {event.location}
                    {event.fieldName && ` - ${event.fieldName}`}
                    {event.opponent && ` | vs ${event.opponent}`}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(event)}
                    className="px-3 py-1 rounded text-xs font-medium text-primary bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-3 py-1 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
