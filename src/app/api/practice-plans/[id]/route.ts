import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const plan = await prisma.practicePlan.findUnique({
      where: { id },
      include: {
        drills: {
          include: { drill: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Practice plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to fetch practice plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice plan" },
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
    const { date, title, focus, notes, drills } = body;

    const existing = await prisma.practicePlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Practice plan not found" },
        { status: 404 }
      );
    }

    // If drills are provided, replace them entirely
    if (drills && Array.isArray(drills)) {
      await prisma.practicePlanDrill.deleteMany({
        where: { practicePlanId: id },
      });
    }

    const plan = await prisma.practicePlan.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(title !== undefined && { title }),
        ...(focus !== undefined && { focus }),
        ...(notes !== undefined && { notes }),
        ...(drills &&
          Array.isArray(drills) && {
            drills: {
              create: drills.map((d: { drillId: string; order: number }) => ({
                drillId: d.drillId,
                order: d.order,
              })),
            },
          }),
      },
      include: {
        drills: {
          include: { drill: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to update practice plan:", error);
    return NextResponse.json(
      { error: "Failed to update practice plan" },
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

    const existing = await prisma.practicePlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Practice plan not found" },
        { status: 404 }
      );
    }

    await prisma.practicePlan.delete({ where: { id } });

    return NextResponse.json({ message: "Practice plan deleted" });
  } catch (error) {
    console.error("Failed to delete practice plan:", error);
    return NextResponse.json(
      { error: "Failed to delete practice plan" },
      { status: 500 }
    );
  }
}
