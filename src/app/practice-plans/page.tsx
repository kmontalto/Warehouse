import { prisma } from "@/lib/db";
import PracticePlanCard from "@/components/PracticePlanCard";

export const dynamic = "force-dynamic";

export default async function PracticePlansPage() {
  const plans = await prisma.practicePlan.findMany({
    orderBy: { date: "desc" },
    include: {
      drills: {
        include: { drill: true },
        orderBy: { order: "asc" },
      },
    },
  });

  // Serialize dates for client component
  const serializedPlans = plans.map((plan) => ({
    id: plan.id,
    date: plan.date.toISOString(),
    title: plan.title,
    focus: plan.focus,
    notes: plan.notes,
    drills: plan.drills.map((pd) => ({
      id: pd.id,
      order: pd.order,
      drill: {
        id: pd.drill.id,
        name: pd.drill.name,
        duration: pd.drill.duration,
        skillFocus: pd.drill.skillFocus,
        description: pd.drill.description,
      },
    })),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-primary-dark">Practice Plans</h1>
        <p className="mt-1 text-slate-500">
          Organized drills and practice sessions
        </p>
      </div>

      {serializedPlans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400">No practice plans created yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {serializedPlans.map((plan) => (
            <PracticePlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
