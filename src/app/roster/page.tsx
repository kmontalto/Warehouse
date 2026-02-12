import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const players = await prisma.player.findMany({
    where: { active: true },
    orderBy: { jerseyNumber: "asc" },
    include: {
      _count: {
        select: { playerOfGames: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">Roster</h1>
        <p className="mt-1 text-slate-500">
          Warehouse 10U Team ({players.length} players)
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {players.map((player) => {
          const positions = player.positions
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);

          return (
            <Link
              key={player.id}
              href={`/roster/${player.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group"
            >
              {/* Jersey Number */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center">
                  <span className="text-2xl font-bold text-yellow-400">
                    {player.jerseyNumber}
                  </span>
                </div>
                {player._count.playerOfGames > 0 && (
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-bold">
                      {player._count.playerOfGames}
                    </span>
                  </div>
                )}
              </div>

              {/* Player Name */}
              <div className="font-bold text-slate-800 group-hover:text-blue-900 transition-colors">
                {player.firstName} {player.lastName}
              </div>

              {/* Positions */}
              <div className="mt-2 flex flex-wrap gap-1">
                {positions.map((pos) => (
                  <span
                    key={pos}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
                  >
                    {pos}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400">No players on the roster yet.</p>
        </div>
      )}
    </div>
  );
}
