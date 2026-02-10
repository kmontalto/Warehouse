import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, data } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Missing required field: templateId" },
        { status: 400 }
      );
    }

    const template = await prisma.messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Replace {{placeholders}} in subject and body
    const replacePlaceholders = (text: string, values: Record<string, string>): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return values[key] !== undefined ? values[key] : match;
      });
    };

    const templateData: Record<string, string> = {
      date: data?.date || "",
      time: data?.time || "",
      location: data?.location || "",
      field: data?.field || "",
      opponent: data?.opponent || "",
      status: data?.status || "",
      details: data?.details || "",
      focus: data?.focus || "",
    };

    const generatedSubject = replacePlaceholders(template.subject, templateData);
    const generatedBody = replacePlaceholders(template.body, templateData);

    return NextResponse.json({
      subject: generatedSubject,
      body: generatedBody,
      templateName: template.name,
      templateType: template.type,
    });
  } catch (error) {
    console.error("Failed to generate message:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
