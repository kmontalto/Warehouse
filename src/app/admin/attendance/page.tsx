import { prisma } from "@/lib/db";
import AdminAttendance from "@/components/AdminAttendance";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  const [events, players] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
    }),
    prisma.player.findMany({
      where: { active: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const serializedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date.toISOString().split("T")[0],
    type: e.type,
  }));

  const serializedPlayers = players.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    jerseyNumber: p.jerseyNumber,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">Attendance</h1>
        <p className="mt-1 text-slate-500">
          Mark player attendance for events
        </p>
      </div>
      <AdminAttendance events={serializedEvents} players={serializedPlayers} />
    </div>
  );
}
