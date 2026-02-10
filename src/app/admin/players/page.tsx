import { prisma } from "@/lib/db";
import AdminPlayers from "@/components/AdminPlayers";

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: { jerseyNumber: "asc" },
  });

  const serializedPlayers = players.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    jerseyNumber: p.jerseyNumber,
    positions: p.positions,
    active: p.active,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">Manage Players</h1>
        <p className="mt-1 text-slate-500">
          Add, edit, and manage roster players
        </p>
      </div>
      <AdminPlayers initialPlayers={serializedPlayers} />
    </div>
  );
}
