import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/players", label: "Players" },
    { href: "/admin/attendance", label: "Attendance" },
    { href: "/admin/player-of-game", label: "Player of Game" },
    { href: "/admin/practice-plans", label: "Practice Plans" },
  ];

  return (
    <div>
      {/* Admin Header Bar */}
      <div className="bg-yellow-400 border-b border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-900 text-yellow-400">
                COACH MODE
              </span>
              <span className="text-sm font-medium text-blue-900">
                Welcome, {user.name}
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2 py-1 rounded text-xs font-medium text-blue-900 hover:bg-yellow-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile admin nav */}
      <div className="md:hidden bg-yellow-50 border-b border-yellow-200">
        <div className="px-4 py-2 flex flex-wrap gap-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 py-1 rounded text-xs font-medium text-blue-900 bg-yellow-100 hover:bg-yellow-200 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}
