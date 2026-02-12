import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();

  // Fetch upcoming events (next 5)
  const upcomingEvents = await prisma.event.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    take: 5,
    include: {
      playerOfGame: { include: { player: true } },
    },
  });

  // Fetch recent results (last 5 games with results)
  const recentResults = await prisma.event.findMany({
    where: {
      type: "game",
      result: { not: null },
    },
    orderBy: { date: "desc" },
    take: 5,
    include: {
      playerOfGame: { include: { player: true } },
    },
  });

  // Calculate season record
  const allGamesWithResults = await prisma.event.findMany({
    where: {
      type: "game",
      result: { not: null },
    },
  });

  let wins = 0;
  let losses = 0;
  let ties = 0;
  allGamesWithResults.forEach((game) => {
    if (game.result) {
      const r = game.result.trim().toUpperCase();
      if (r.startsWith("W")) wins++;
      else if (r.startsWith("L")) losses++;
      else if (r.startsWith("T")) ties++;
    }
  });

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

  const resultColor = (result: string | null) => {
    if (!result) return "";
    const r = result.trim().toUpperCase();
    if (r.startsWith("W")) return "text-green-600 font-bold";
    if (r.startsWith("L")) return "text-red-600 font-bold";
    return "text-gray-600 font-bold";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">
          Warehouse 10U Command Center
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Travel Baseball Team Management
        </p>
      </div>

      {/* Season Record Card */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Season Record</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600">{wins}</div>
            <div className="text-sm text-slate-500 font-medium">Wins</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-red-600">{losses}</div>
            <div className="text-sm text-slate-500 font-medium">Losses</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-600">{ties}</div>
            <div className="text-sm text-slate-500 font-medium">Ties</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900">Upcoming Events</h2>
            <Link
              href="/schedule"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No upcoming events scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {typeBadge(event.type)}
                        <span className="text-sm font-semibold text-slate-800">
                          {event.title}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">
                        {format(new Date(event.date), "EEE, MMM d")} at {event.time}
                      </div>
                      <div className="text-sm text-slate-400">
                        {event.location}
                        {event.fieldName && ` - ${event.fieldName}`}
                      </div>
                      {event.opponent && (
                        <div className="text-sm text-slate-500 mt-1">
                          vs {event.opponent}{" "}
                          {event.homeAway && (
                            <span className="text-xs text-slate-400">
                              ({event.homeAway})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      {format(new Date(event.date), "M/d")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900">Recent Results</h2>
            <Link
              href="/schedule"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No game results yet.</p>
          ) : (
            <div className="space-y-3">
              {recentResults.map((game) => (
                <div
                  key={game.id}
                  className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-800">
                        {game.title}
                      </div>
                      <div className="text-sm text-slate-500">
                        {format(new Date(game.date), "EEE, MMM d")}
                        {game.opponent && ` vs ${game.opponent}`}
                      </div>
                      {game.playerOfGame && (
                        <div className="mt-1 inline-flex items-center space-x-1 text-xs text-yellow-600">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>
                            POG: {game.playerOfGame.player.firstName}{" "}
                            {game.playerOfGame.player.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`text-lg ${resultColor(game.result)}`}>
                      {game.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/schedule"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-1">&#128197;</div>
          <div className="text-sm font-medium text-slate-700">Schedule</div>
        </Link>
        <Link
          href="/roster"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-1">&#9918;</div>
          <div className="text-sm font-medium text-slate-700">Roster</div>
        </Link>
        <Link
          href="/practice-plans"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-1">&#128203;</div>
          <div className="text-sm font-medium text-slate-700">Practice Plans</div>
        </Link>
        <Link
          href="/messages"
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-1">&#128172;</div>
          <div className="text-sm font-medium text-slate-700">Messages</div>
        </Link>
      </div>
    </div>
  );
}
