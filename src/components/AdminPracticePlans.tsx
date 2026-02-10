"use client";

import { useState } from "react";

interface DrillOption {
  id: string;
  name: string;
  duration: number;
  skillFocus: string;
  description: string | null;
}

interface PlanDrill {
  id: string;
  order: number;
  drillId: string;
  drill: {
    id: string;
    name: string;
    duration: number;
    skillFocus: string;
  };
}

interface PracticePlanData {
  id: string;
  date: string;
  title: string;
  focus: string | null;
  notes: string | null;
  drills: PlanDrill[];
}

const FOCUS_OPTIONS = ["Hitting", "Fielding", "Pitching", "General"];

const emptyForm = {
  title: "",
  date: "",
  focus: "General",
  notes: "",
};

export default function AdminPracticePlans({
  initialPlans,
  availableDrills,
}: {
  initialPlans: PracticePlanData[];
  availableDrills: DrillOption[];
}) {
  const [plans, setPlans] = useState<PracticePlanData[]>(initialPlans);
  const [form, setForm] = useState(emptyForm);
  const [selectedDrills, setSelectedDrills] = useState<
    { drillId: string; order: number }[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addDrill = (drillId: string) => {
    if (selectedDrills.find((d) => d.drillId === drillId)) return;
    setSelectedDrills([
      ...selectedDrills,
      { drillId, order: selectedDrills.length + 1 },
    ]);
  };

  const removeDrill = (drillId: string) => {
    const filtered = selectedDrills.filter((d) => d.drillId !== drillId);
    setSelectedDrills(filtered.map((d, i) => ({ ...d, order: i + 1 })));
  };

  const moveDrill = (index: number, direction: "up" | "down") => {
    const newDrills = [...selectedDrills];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDrills.length) return;
    [newDrills[index], newDrills[targetIndex]] = [
      newDrills[targetIndex],
      newDrills[index],
    ];
    setSelectedDrills(newDrills.map((d, i) => ({ ...d, order: i + 1 })));
  };

  const getDrillById = (id: string) =>
    availableDrills.find((d) => d.id === id);

  const totalDuration = selectedDrills.reduce((sum, sd) => {
    const drill = getDrillById(sd.drillId);
    return sum + (drill?.duration || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        title: form.title,
        date: form.date,
        focus: form.focus || null,
        notes: form.notes || null,
        drills: selectedDrills,
      };

      if (editingId) {
        const res = await fetch(`/api/practice-plans/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update practice plan");
        }
        const updated = await res.json();
        setPlans(
          plans.map((p) =>
            p.id === editingId
              ? {
                  ...updated,
                  date: updated.date.split("T")[0],
                  drills: updated.drills.map(
                    (d: { id: string; order: number; drillId: string; drill: { id: string; name: string; duration: number; skillFocus: string } }) => ({
                      id: d.id,
                      order: d.order,
                      drillId: d.drillId || d.drill?.id,
                      drill: d.drill,
                    })
                  ),
                }
              : p
          )
        );
        setSuccess("Practice plan updated!");
        setEditingId(null);
      } else {
        const res = await fetch("/api/practice-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create practice plan");
        }
        const created = await res.json();
        setPlans([
          {
            ...created,
            date: created.date.split("T")[0],
            drills: created.drills.map(
              (d: { id: string; order: number; drillId: string; drill: { id: string; name: string; duration: number; skillFocus: string } }) => ({
                id: d.id,
                order: d.order,
                drillId: d.drillId || d.drill?.id,
                drill: d.drill,
              })
            ),
          },
          ...plans,
        ]);
        setSuccess("Practice plan created!");
      }
      setForm(emptyForm);
      setSelectedDrills([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: PracticePlanData) => {
    setEditingId(plan.id);
    setForm({
      title: plan.title,
      date: plan.date,
      focus: plan.focus || "General",
      notes: plan.notes || "",
    });
    setSelectedDrills(
      plan.drills.map((d) => ({
        drillId: d.drillId || d.drill.id,
        order: d.order,
      }))
    );
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClone = (plan: PracticePlanData) => {
    setEditingId(null);
    setForm({
      title: `${plan.title} (Copy)`,
      date: "",
      focus: plan.focus || "General",
      notes: plan.notes || "",
    });
    setSelectedDrills(
      plan.drills.map((d) => ({
        drillId: d.drillId || d.drill.id,
        order: d.order,
      }))
    );
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this practice plan?"))
      return;

    try {
      const res = await fetch(`/api/practice-plans/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPlans(plans.filter((p) => p.id !== id));
      setSuccess("Practice plan deleted!");
    } catch {
      setError("Failed to delete practice plan");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedDrills([]);
    setError("");
  };

  const skillBadgeColor = (skill: string) => {
    switch (skill) {
      case "Hitting":
        return "bg-orange-100 text-orange-800";
      case "Fielding":
        return "bg-blue-100 text-blue-800";
      case "Pitching":
        return "bg-red-100 text-red-800";
      case "Baserunning":
        return "bg-green-100 text-green-800";
      case "Conditioning":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div>
      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          {editingId ? "Edit Practice Plan" : "Create New Practice Plan"}
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
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pre-Game Hitting Practice"
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
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Focus Area
              </label>
              <select
                name="focus"
                value={form.focus}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FOCUS_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes about this practice..."
            />
          </div>

          {/* Drill Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Add Drills
            </label>
            {availableDrills.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No drills available. Create drills first via the API.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {availableDrills.map((drill) => {
                  const isSelected = selectedDrills.some(
                    (sd) => sd.drillId === drill.id
                  );
                  return (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() =>
                        isSelected
                          ? removeDrill(drill.id)
                          : addDrill(drill.id)
                      }
                      className={`p-2 rounded-lg text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-100 border-blue-300 border"
                          : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">
                          {drill.name}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${skillBadgeColor(
                            drill.skillFocus
                          )}`}
                        >
                          {drill.skillFocus}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {drill.duration} min
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Drills (ordered) */}
          {selectedDrills.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Drill Order ({selectedDrills.length} drills, {totalDuration}{" "}
                  min total)
                </label>
              </div>
              <div className="space-y-1">
                {selectedDrills.map((sd, index) => {
                  const drill = getDrillById(sd.drillId);
                  if (!drill) return null;
                  return (
                    <div
                      key={sd.drillId}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-700">
                        {drill.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {drill.duration} min
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveDrill(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDrill(index, "down")}
                          disabled={index === selectedDrills.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDrill(sd.drillId)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Plan"
                : "Create Plan"}
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

      {/* Existing Plans */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          All Practice Plans ({plans.length})
        </h2>
        {plans.length === 0 ? (
          <p className="text-slate-400 text-sm">No practice plans yet.</p>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const planTotalDuration = plan.drills.reduce(
                (sum, d) => sum + d.drill.duration,
                0
              );
              return (
                <div
                  key={plan.id}
                  className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-slate-800">
                          {plan.title}
                        </span>
                        {plan.focus && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${skillBadgeColor(
                              plan.focus
                            )}`}
                          >
                            {plan.focus}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {plan.date} | {plan.drills.length} drills |{" "}
                        {planTotalDuration} min
                      </div>
                      {plan.drills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {plan.drills.map((d) => (
                            <span
                              key={d.id}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500"
                            >
                              {d.order}. {d.drill.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleClone(plan)}
                        className="px-3 py-1 rounded text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        Clone
                      </button>
                      <button
                        onClick={() => handleEdit(plan)}
                        className="px-3 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="px-3 py-1 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
