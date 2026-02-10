import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const upcoming = searchParams.get("upcoming");

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (upcoming === "true") {
      where.date = { gte: new Date() };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: upcoming === "true" ? "asc" : "desc" },
      include: {
        attendance: {
          include: { player: true },
        },
        playerOfGame: {
          include: { player: true },
        },
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
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
    const { type, title, date, time, location, fieldName, opponent, homeAway, notes } = body;

    if (!type || !title || !date || !time || !location) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, date, time, location" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        type,
        title,
        date: new Date(date),
        time,
        location,
        fieldName: fieldName || null,
        opponent: opponent || null,
        homeAway: homeAway || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
