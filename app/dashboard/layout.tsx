import Link from "next/link";
import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import HamburgerMenu from "./components/HamburgerMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Glass Header */}
      <header className="glass sticky top-0 z-30 mx-3 mt-3 px-4 py-3 rounded-2xl border-slate-200/60">
        <div className="flex items-center justify-between">
          <HamburgerMenu />
          <h1 className="text-lg font-extrabold text-slate-800">
            <span className="gradient-text">ساراپورت</span>
          </h1>
          <Link
            href="/dashboard/settings"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-sm font-bold text-white shadow-md shadow-emerald-400/20 transition-transform hover:scale-105 active:scale-95"
          >
            {profile?.full_name?.[0] || user.email?.[0] || "؟"}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 pb-20">{children}</main>

      {/* Glass Bottom Navigation */}
      <nav className="glass fixed bottom-3 left-3 right-3 z-30 border-slate-200/60 rounded-2xl">
        <div className="flex items-center justify-around py-1">
          <NavItem href="/dashboard/nutrition" label="تغذیه" icon={NutritionIcon} />
          <NavItem href="/dashboard/log" label="ثبت" icon={LogIcon} />
          <NavItem href="/dashboard/food" label="غذا" icon={FoodIcon} />
          <NavItem href="/dashboard/chat" label="مربی" icon={CoachIcon} />
          <NavItem href="/dashboard/progress" label="پیشرفت" icon={ProgressIcon} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center px-2 py-2 text-[10px] font-medium text-slate-400 transition-colors hover:text-emerald-500"
    >
      <Icon className="h-5 w-5 mb-0.5" />
      <span>{label}</span>
    </Link>
  );
}

// SVG Icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function LogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function FoodIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function CoachIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function NutritionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 2c2.2 0 4 1.8 4 4v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-2.2 1.8-4 4-4zm-4 5l-2 2m8-2l2 2" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  );
}

function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
