import { prisma } from "@/lib/db";
import MessageGenerator from "@/components/MessageGenerator";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const templates = await prisma.messageTemplate.findMany({
    orderBy: { name: "asc" },
  });

  const serializedTemplates = templates.map((t) => ({
    id: t.id,
    type: t.type,
    name: t.name,
    subject: t.subject,
    body: t.body,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-primary-dark">Messages</h1>
        <p className="mt-1 text-slate-500">
          Generate messages from templates for parents and players
        </p>
      </div>

      <MessageGenerator templates={serializedTemplates} />
    </div>
  );
}
