import { prisma } from "@/lib/db";
import AdminEvents from "@/components/AdminEvents";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      playerOfGame: { include: { player: true } },
    },
  });

  const serializedEvents = events.map((event) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    date: event.date.toISOString().split("T")[0],
    time: event.time,
    location: event.location,
    fieldName: event.fieldName,
    opponent: event.opponent,
    homeAway: event.homeAway,
    result: event.result,
    notes: event.notes,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">Manage Events</h1>
        <p className="mt-1 text-slate-500">
          Create, edit, and delete games, practices, and tournaments
        </p>
      </div>
      <AdminEvents initialEvents={serializedEvents} />
    </div>
  );
}
