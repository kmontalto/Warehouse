import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const playerOfGames = await prisma.playerOfTheGame.findMany({
      take: limit,
      orderBy: { event: { date: "desc" } },
      include: {
        player: true,
        event: true,
      },
    });

    return NextResponse.json(playerOfGames);
  } catch (error) {
    console.error("Failed to fetch player of game records:", error);
    return NextResponse.json(
      { error: "Failed to fetch player of game records" },
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
    const { playerId, eventId, reason } = body;

    if (!playerId || !eventId) {
      return NextResponse.json(
        { error: "Missing required fields: playerId, eventId" },
        { status: 400 }
      );
    }

    // Check if a POG already exists for this event
    const existing = await prisma.playerOfTheGame.findUnique({
      where: { eventId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A Player of the Game has already been selected for this event" },
        { status: 409 }
      );
    }

    const playerOfGame = await prisma.playerOfTheGame.create({
      data: {
        playerId,
        eventId,
        reason: reason || null,
      },
      include: {
        player: true,
        event: true,
      },
    });

    return NextResponse.json(playerOfGame, { status: 201 });
  } catch (error) {
    console.error("Failed to create player of game:", error);
    return NextResponse.json(
      { error: "Failed to create player of game" },
      { status: 500 }
    );
  }
}
