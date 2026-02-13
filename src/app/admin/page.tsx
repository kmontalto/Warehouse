import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [playerCount, eventCount, upcomingEvents, recentGamesWithoutPOG] =
    await Promise.all([
      prisma.player.count({ where: { active: true } }),
      prisma.event.count(),
      prisma.event.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.event.findMany({
        where: {
          type: "game",
          result: { not: null },
          playerOfGame: null,
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

  const quickActions = [
    {
      href: "/admin/events",
      label: "Add Event",
      description: "Schedule a game, practice, or tournament",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      href: "/admin/players",
      label: "Add Player",
      description: "Add or manage roster players",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      href: "/admin/attendance",
      label: "Mark Attendance",
      description: "Record who showed up to events",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      href: "/admin/player-of-game",
      label: "Mark POG",
      description: "Select Player of the Game",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: "bg-amber-50 text-yellow-700 border-amber-200",
    },
    {
      href: "/admin/practice-plans",
      label: "Practice Plans",
      description: "Create and manage practice plans",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-primary-dark">Admin Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Manage your Warehouse 10U team
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-dark">{playerCount}</div>
          <div className="text-sm text-slate-500">Active Players</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-dark">{eventCount}</div>
          <div className="text-sm text-slate-500">Total Events</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-dark">
            {upcomingEvents.length}
          </div>
          <div className="text-sm text-slate-500">Upcoming</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-accent">
            {recentGamesWithoutPOG.length}
          </div>
          <div className="text-sm text-slate-500">Need POG</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-primary-dark mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${action.color}`}
          >
            <div className="mb-3">{action.icon}</div>
            <div className="font-semibold text-sm">{action.label}</div>
            <div className="text-xs mt-1 opacity-75">{action.description}</div>
          </Link>
        ))}
      </div>

      {/* Games needing POG */}
      {recentGamesWithoutPOG.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-primary-dark mb-4">
            Games Needing Player of the Game
          </h2>
          <div className="space-y-2">
            {recentGamesWithoutPOG.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    {game.title}
                  </div>
                  <div className="text-xs text-slate-400">
                    {format(new Date(game.date), "MMM d, yyyy")} - {game.result}
                  </div>
                </div>
                <Link
                  href="/admin/player-of-game"
                  className="text-xs font-medium text-primary hover:text-primary-dark"
                >
                  Assign POG
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
