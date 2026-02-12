import { prisma } from "@/lib/db";
import ScheduleFilter from "@/components/ScheduleFilter";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

  // Serialize dates for client component
  const serializedEvents = events.map((event) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    date: event.date.toISOString(),
    time: event.time,
    location: event.location,
    fieldName: event.fieldName,
    opponent: event.opponent,
    homeAway: event.homeAway,
    result: event.result,
    notes: event.notes,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">Schedule</h1>
        <p className="mt-1 text-slate-500">
          All games, practices, and tournaments
        </p>
      </div>
      <ScheduleFilter events={serializedEvents} />
    </div>
  );
}
