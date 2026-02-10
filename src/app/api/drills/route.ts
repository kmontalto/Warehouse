import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillFocus = searchParams.get("skillFocus");

    const where: Record<string, unknown> = {};

    if (skillFocus) {
      where.skillFocus = skillFocus;
    }

    const drills = await prisma.drill.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(drills);
  } catch (error) {
    console.error("Failed to fetch drills:", error);
    return NextResponse.json(
      { error: "Failed to fetch drills" },
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
    const { name, duration, skillFocus, description } = body;

    if (!name || !duration || !skillFocus) {
      return NextResponse.json(
        { error: "Missing required fields: name, duration, skillFocus" },
        { status: 400 }
      );
    }

    const drill = await prisma.drill.create({
      data: {
        name,
        duration: Number(duration),
        skillFocus,
        description: description || null,
      },
    });

    return NextResponse.json(drill, { status: 201 });
  } catch (error) {
    console.error("Failed to create drill:", error);
    return NextResponse.json(
      { error: "Failed to create drill" },
      { status: 500 }
    );
  }
}
