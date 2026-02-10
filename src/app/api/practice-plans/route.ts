import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const plans = await prisma.practicePlan.findMany({
      orderBy: { date: "desc" },
      include: {
        drills: {
          include: { drill: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Failed to fetch practice plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice plans" },
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
    const { date, title, focus, notes, drills } = body;

    if (!date || !title) {
      return NextResponse.json(
        { error: "Missing required fields: date, title" },
        { status: 400 }
      );
    }

    if (drills && !Array.isArray(drills)) {
      return NextResponse.json(
        { error: "drills must be an array of { drillId, order }" },
        { status: 400 }
      );
    }

    const plan = await prisma.practicePlan.create({
      data: {
        date: new Date(date),
        title,
        focus: focus || null,
        notes: notes || null,
        drills: {
          create: drills
            ? drills.map((d: { drillId: string; order: number }) => ({
                drillId: d.drillId,
                order: d.order,
              }))
            : [],
        },
      },
      include: {
        drills: {
          include: { drill: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Failed to create practice plan:", error);
    return NextResponse.json(
      { error: "Failed to create practice plan" },
      { status: 500 }
    );
  }
}
