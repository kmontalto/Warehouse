import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { active: true },
      orderBy: { lastName: "asc" },
      include: {
        _count: {
          select: { playerOfGames: true },
        },
      },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, jerseyNumber, positions } = body;

    if (!firstName || !lastName || jerseyNumber === undefined || !positions) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, jerseyNumber, positions" },
        { status: 400 }
      );
    }

    const player = await prisma.player.create({
      data: {
        firstName,
        lastName,
        jerseyNumber: Number(jerseyNumber),
        positions,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Failed to create player:", error);
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  }
}
