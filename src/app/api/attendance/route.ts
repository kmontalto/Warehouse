import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId query parameter is required" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        player: true,
        event: true,
      },
      orderBy: { player: { lastName: "asc" } },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
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
    const { playerId, eventId, status } = body;

    if (!playerId || !eventId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: playerId, eventId, status" },
        { status: 400 }
      );
    }

    const validStatuses = ["present", "absent", "pending"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        playerId_eventId: { playerId, eventId },
      },
      update: { status },
      create: { playerId, eventId, status },
      include: {
        player: true,
        event: true,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
