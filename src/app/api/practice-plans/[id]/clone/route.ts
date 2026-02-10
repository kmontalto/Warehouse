import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
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
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Missing required field: date" },
        { status: 400 }
      );
    }

    const original = await prisma.practicePlan.findUnique({
      where: { id },
      include: {
        drills: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Practice plan not found" },
        { status: 404 }
      );
    }

    const cloned = await prisma.practicePlan.create({
      data: {
        date: new Date(date),
        title: `${original.title} (Copy)`,
        focus: original.focus,
        notes: original.notes,
        drills: {
          create: original.drills.map((d) => ({
            drillId: d.drillId,
            order: d.order,
          })),
        },
      },
      include: {
        drills: {
          include: { drill: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error("Failed to clone practice plan:", error);
    return NextResponse.json(
      { error: "Failed to clone practice plan" },
      { status: 500 }
    );
  }
}
