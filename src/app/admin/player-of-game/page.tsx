import { prisma } from "@/lib/db";
import AdminPlayerOfGame from "@/components/AdminPlayerOfGame";

export const dynamic = "force-dynamic";

export default async function AdminPlayerOfGamePage() {
  const [gamesWithoutPOG, players] = await Promise.all([
    prisma.event.findMany({
      where: {
        type: "game",
        result: { not: null },
        playerOfGame: null,
      },
      orderBy: { date: "desc" },
    }),
    prisma.player.findMany({
      where: { active: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const serializedGames = gamesWithoutPOG.map((g) => ({
    id: g.id,
    title: g.title,
    date: g.date.toISOString().split("T")[0],
    opponent: g.opponent,
    result: g.result,
  }));

  const serializedPlayers = players.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    jerseyNumber: p.jerseyNumber,
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">
          Player of the Game
        </h1>
        <p className="mt-1 text-slate-500">
          Select the player of the game for completed games
        </p>
      </div>
      <AdminPlayerOfGame games={serializedGames} players={serializedPlayers} />
    </div>
  );
}
