"use client";

import { useState } from "react";

interface GameData {
  id: string;
  title: string;
  date: string;
  opponent: string | null;
  result: string | null;
}

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
}

export default function AdminPlayerOfGame({
  games,
  players,
}: {
  games: GameData[];
  players: PlayerData[];
}) {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assignedGames, setAssignedGames] = useState<string[]>([]);

  const availableGames = games.filter((g) => !assignedGames.includes(g.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || !selectedPlayerId) {
      setError("Please select both a game and a player.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/player-of-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedGameId,
          playerId: selectedPlayerId,
          reason: reason || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign Player of the Game");
      }

      const data = await res.json();
      const player = players.find((p) => p.id === selectedPlayerId);
      const game = games.find((g) => g.id === selectedGameId);

      setAssignedGames([...assignedGames, selectedGameId]);
      setSuccess(
        `${player?.firstName} ${player?.lastName} selected as Player of the Game for "${game?.title}"!`
      );
      setSelectedGameId("");
      setSelectedPlayerId("");
      setReason("");

      // Notify about the assignment
      console.log("POG assigned:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const selectedGame = games.find((g) => g.id === selectedGameId);

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {success}
          </div>
        )}

        {availableGames.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400">
              All completed games have a Player of the Game assigned!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Game
              </label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a game...</option>
                {availableGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.date} - {game.title}
                    {game.opponent && ` vs ${game.opponent}`}
                    {game.result && ` (${game.result})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Game Info Card */}
            {selectedGame && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="font-semibold text-primary-dark">
                  {selectedGame.title}
                </div>
                <div className="text-sm text-primary mt-1">
                  {selectedGame.date}
                  {selectedGame.opponent && ` vs ${selectedGame.opponent}`}
                  {selectedGame.result && (
                    <span
                      className={`ml-2 font-bold ${
                        selectedGame.result.trim().toUpperCase().startsWith("W")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedGame.result}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Player
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedPlayerId === player.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent">
                          {player.jerseyNumber}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., 3-for-4 with 2 RBIs, great pitching performance..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !selectedGameId || !selectedPlayerId}
              className="w-full bg-yellow-500 text-primary-dark py-3 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {loading ? "Assigning..." : "Assign Player of the Game"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
