import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        attendance: {
          include: { event: true },
          orderBy: { event: { date: "desc" } },
        },
        playerOfGames: {
          include: { event: true },
          orderBy: { event: { date: "desc" } },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Failed to fetch player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, jerseyNumber, positions, active } = body;

    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const player = await prisma.player.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(jerseyNumber !== undefined && { jerseyNumber: Number(jerseyNumber) }),
        ...(positions !== undefined && { positions }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("Failed to update player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const player = await prisma.player.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ message: "Player set to inactive", player });
  } catch (error) {
    console.error("Failed to deactivate player:", error);
    return NextResponse.json(
      { error: "Failed to deactivate player" },
      { status: 500 }
    );
  }
}
