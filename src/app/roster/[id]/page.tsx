import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      playerOfGames: {
        include: { event: true },
        orderBy: { event: { date: "desc" } },
      },
      attendance: {
        include: { event: true },
        orderBy: { event: { date: "desc" } },
        take: 20,
      },
    },
  });

  if (!player) {
    notFound();
  }

  const positions = player.positions
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const attendanceStats = {
    present: player.attendance.filter((a) => a.status === "present").length,
    absent: player.attendance.filter((a) => a.status === "absent").length,
    total: player.attendance.length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/roster"
        className="inline-flex items-center text-sm text-primary hover:text-primary-dark mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Roster
      </Link>

      {/* Player Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 rounded-full bg-primary-dark flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-accent">
              {player.jerseyNumber}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-primary-dark">
              {player.firstName} {player.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {positions.map((pos) => (
                <span
                  key={pos}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {pos}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player of the Game History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-primary-dark mb-4 flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Player of the Game ({player.playerOfGames.length})
          </h2>
          {player.playerOfGames.length === 0 ? (
            <p className="text-slate-400 text-sm">No Player of the Game awards yet.</p>
          ) : (
            <div className="space-y-3">
              {player.playerOfGames.map((pog) => (
                <div
                  key={pog.id}
                  className="border border-amber-200 bg-amber-50 rounded-lg p-3"
                >
                  <div className="font-semibold text-sm text-slate-800">
                    {pog.event.title}
                  </div>
                  <div className="text-sm text-slate-500">
                    {format(new Date(pog.event.date), "EEE, MMM d, yyyy")}
                    {pog.event.result && (
                      <span className="ml-2 font-medium">
                        {pog.event.result}
                      </span>
                    )}
                  </div>
                  {pog.reason && (
                    <div className="mt-1 text-sm text-yellow-700 italic">
                      &quot;{pog.reason}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Record */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-primary-dark mb-4">
            Recent Attendance
          </h2>

          {/* Stats summary */}
          {attendanceStats.total > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600">
                  {attendanceStats.present}
                </div>
                <div className="text-xs text-slate-500">Present</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-600">
                  {attendanceStats.absent}
                </div>
                <div className="text-xs text-slate-500">Absent</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary">
                  {attendanceStats.total > 0
                    ? Math.round(
                        (attendanceStats.present / attendanceStats.total) * 100
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-slate-500">Rate</div>
              </div>
            </div>
          )}

          {player.attendance.length === 0 ? (
            <p className="text-slate-400 text-sm">No attendance records yet.</p>
          ) : (
            <div className="space-y-2">
              {player.attendance.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      {att.event.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {format(new Date(att.event.date), "MMM d, yyyy")}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      att.status === "present"
                        ? "bg-green-100 text-green-800"
                        : att.status === "absent"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {att.status.charAt(0).toUpperCase() + att.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
