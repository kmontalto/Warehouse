import { prisma } from "@/lib/db";
import AdminPracticePlans from "@/components/AdminPracticePlans";

export default async function AdminPracticePlansPage() {
  const [plans, drills] = await Promise.all([
    prisma.practicePlan.findMany({
      orderBy: { date: "desc" },
      include: {
        drills: {
          include: { drill: true },
          orderBy: { order: "asc" },
        },
      },
    }),
    prisma.drill.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedPlans = plans.map((plan) => ({
    id: plan.id,
    date: plan.date.toISOString().split("T")[0],
    title: plan.title,
    focus: plan.focus,
    notes: plan.notes,
    drills: plan.drills.map((pd) => ({
      id: pd.id,
      order: pd.order,
      drillId: pd.drillId,
      drill: {
        id: pd.drill.id,
        name: pd.drill.name,
        duration: pd.drill.duration,
        skillFocus: pd.drill.skillFocus,
      },
    })),
  }));

  const serializedDrills = drills.map((d) => ({
    id: d.id,
    name: d.name,
    duration: d.duration,
    skillFocus: d.skillFocus,
    description: d.description,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-900">
          Manage Practice Plans
        </h1>
        <p className="mt-1 text-slate-500">
          Create, edit, and clone practice plans
        </p>
      </div>
      <AdminPracticePlans
        initialPlans={serializedPlans}
        availableDrills={serializedDrills}
      />
    </div>
  );
}
