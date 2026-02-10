import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch message templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch message templates" },
      { status: 500 }
    );
  }
}
