"use client";

import { useState } from "react";

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  positions: string;
  active: boolean;
}

const POSITION_OPTIONS = [
  "P",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "LF",
  "CF",
  "RF",
];

const emptyForm = {
  firstName: "",
  lastName: "",
  jerseyNumber: "",
  positions: [] as string[],
};

export default function AdminPlayers({
  initialPlayers,
}: {
  initialPlayers: PlayerData[];
}) {
  const [players, setPlayers] = useState<PlayerData[]>(initialPlayers);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePosition = (pos: string) => {
    setForm((prev) => ({
      ...prev,
      positions: prev.positions.includes(pos)
        ? prev.positions.filter((p) => p !== pos)
        : [...prev.positions, pos],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (form.positions.length === 0) {
      setError("Please select at least one position.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        jerseyNumber: Number(form.jerseyNumber),
        positions: form.positions.join(","),
      };

      if (editingId) {
        const res = await fetch(`/api/players/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update player");
        }
        const updated = await res.json();
        setPlayers(
          players.map((p) => (p.id === editingId ? { ...updated } : p))
        );
        setSuccess("Player updated successfully!");
        setEditingId(null);
      } else {
        const res = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create player");
        }
        const created = await res.json();
        setPlayers([...players, created]);
        setSuccess("Player added successfully!");
      }
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (player: PlayerData) => {
    setEditingId(player.id);
    setForm({
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: String(player.jerseyNumber),
      positions: player.positions.split(",").map((p) => p.trim()),
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = async (player: PlayerData) => {
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !player.active }),
      });
      if (!res.ok) throw new Error("Failed to update player status");
      const updated = await res.json();
      setPlayers(players.map((p) => (p.id === player.id ? { ...updated } : p)));
      setSuccess(
        `${player.firstName} ${player.lastName} set to ${
          !player.active ? "active" : "inactive"
        }`
      );
    } catch {
      setError("Failed to update player status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("This will set the player to inactive. Continue?")) return;

    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to deactivate player");
      const data = await res.json();
      setPlayers(
        players.map((p) => (p.id === id ? { ...p, active: false, ...data.player } : p))
      );
      setSuccess("Player set to inactive.");
    } catch {
      setError("Failed to deactivate player");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  return (
    <div>
      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">
          {editingId ? "Edit Player" : "Add New Player"}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jersey Number
              </label>
              <input
                name="jerseyNumber"
                type="number"
                min="0"
                max="99"
                value={form.jerseyNumber}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Positions
            </label>
            <div className="flex flex-wrap gap-2">
              {POSITION_OPTIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.positions.includes(pos)
                      ? "bg-primary-dark text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
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
                ? "Update Player"
                : "Add Player"}
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

      {/* Players List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">
          Roster ({players.filter((p) => p.active).length} active,{" "}
          {players.filter((p) => !p.active).length} inactive)
        </h2>
        {players.length === 0 ? (
          <p className="text-slate-400 text-sm">No players yet.</p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border rounded-lg ${
                  player.active
                    ? "border-slate-100 hover:bg-slate-50"
                    : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-dark flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-accent">
                      {player.jerseyNumber}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-800">
                        {player.firstName} {player.lastName}
                      </span>
                      {!player.active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {player.positions
                        .split(",")
                        .map((p) => p.trim())
                        .map((pos) => (
                          <span
                            key={pos}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500"
                          >
                            {pos}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(player)}
                    className="px-3 py-1 rounded text-xs font-medium text-primary bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(player)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      player.active
                        ? "text-yellow-700 bg-amber-50 hover:bg-yellow-100"
                        : "text-green-700 bg-green-50 hover:bg-green-100"
                    }`}
                  >
                    {player.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="px-3 py-1 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Remove
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
