import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/dashboard/onboarding");
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = goals?.[0];

  const today = new Date().toISOString().split("T")[0];
  const { data: todayLog } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="py-4">
      {/* Greeting */}
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-slate-800">
          سلام {profile.full_name?.split(" ")[0] || "کاربر"} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">امروزت رو بساز!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatsCard
          label="هدف"
          value={formatGoalType(activeGoal?.goal_type)}
          icon="🎯"
          color="from-emerald-400 to-emerald-500"
        />
        <StatsCard
          label="کالری"
          value={todayLog?.calories ? `${todayLog.calories}` : "—"}
          sub="کیلوکالری"
          icon="🔥"
          color="from-orange-400 to-orange-500"
        />
        <StatsCard
          label="پروتئین"
          value={todayLog?.protein_g ? `${todayLog.protein_g}` : "—"}
          sub="گرم"
          icon="🥩"
          color="from-red-400 to-red-500"
        />
        <StatsCard
          label="قدم‌ها"
          value={todayLog?.steps ? todayLog.steps.toLocaleString() : "—"}
          icon="👟"
          color="from-blue-400 to-blue-500"
        />
        <StatsCard
          label="آب"
          value={todayLog?.water_l ? `${todayLog.water_l}` : "—"}
          sub="لیتر"
          icon="💧"
          color="from-cyan-400 to-cyan-500"
        />
        <StatsCard
          label="وزن"
          value={todayLog?.weight_kg ? `${todayLog.weight_kg}` : "—"}
          sub="کیلوگرم"
          icon="⚖️"
          color="from-violet-400 to-violet-500"
        />
        <StatsCard
          label="دور کمر"
          value={todayLog?.waist_cm ? `${todayLog.waist_cm}` : "—"}
          sub="سانتی‌متر"
          icon="📏"
          color="from-pink-400 to-pink-500"
        />
        <StatsCard
          label="خواب"
          value={todayLog?.sleep_h ? `${todayLog.sleep_h}` : "—"}
          sub="ساعت"
          icon="🌙"
          color="from-indigo-400 to-indigo-500"
        />
      </div>

      {/* Coach Message Card */}
      <div className="glass mt-4 p-4 border-emerald-200/60">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-md shadow-emerald-400/20">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">پیام مربی امروز</p>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              امروز رو با انگیزه شروع کن! هر قدم کوچک، تو رو به هدفت نزدیک‌تر می‌کنه. 💪
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link
          href="/dashboard/log"
          className="glass flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-600 transition-all hover:scale-[1.02] active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          ثبت گزارش روزانه
        </Link>
        <Link
          href="/dashboard/food"
          className="glass flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-orange-500 transition-all hover:scale-[1.02] active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          ثبت غذای امروز
        </Link>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="glass relative overflow-hidden p-3 transition-all hover:scale-[1.02] active:scale-95">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{value}</p>
          {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
        </div>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`absolute -bottom-1 -left-1 h-1 w-1/2 rounded-full bg-gradient-to-r ${color} opacity-50`} />
    </div>
  );
}

function formatGoalType(type?: string): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    lose_weight: "کاهش وزن",
    reduce_waist: "کاهش سایز کمر",
    build_muscle: "عضله‌سازی",
    maintain: "حفظ وزن",
    custom: "سفارشی",
  };
  return map[type] || type;
}