"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import Link from "next/link";

interface DailySummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  water_ml: number;
}

export default function NutritionPage() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      // Food totals for today
      const { data: logs } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today);

      const s: DailySummary = {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        water_ml: 0,
      };

      if (logs) {
        for (const log of logs) {
          s.calories += log.calories || 0;
          s.protein_g += log.protein_g || 0;
          s.carbs_g += log.carbs_g || 0;
          s.fat_g += log.fat_g || 0;
          s.fiber_g += log.fiber_g || 0;
          s.sugar_g += log.sugar_g || 0;
        }
      }

      // Water today
      const { data: waterLogs } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", user.id)
        .gte("logged_at", `${today}T00:00:00`)
        .lte("logged_at", `${today}T23:59:59`);

      s.water_ml = waterLogs?.reduce((sum, w) => sum + (w.amount_ml || 0), 0) || 0;

      setSummary(s);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const MACROS = [
    { key: "calories", label: "کالری", unit: "kcal", icon: "🔥", color: "#f59e0b" },
    { key: "protein_g", label: "پروتئین", unit: "g", icon: "🥩", color: "#ef4444" },
    { key: "carbs_g", label: "کربوهیدرات", unit: "g", icon: "🍞", color: "#3b82f6" },
    { key: "fat_g", label: "چربی", unit: "g", icon: "🧈", color: "#a855f7" },
    { key: "fiber_g", label: "فیبر", unit: "g", icon: "🥬", color: "#22c55e" },
    { key: "sugar_g", label: "قند", unit: "g", icon: "🍬", color: "#ec4899" },
    { key: "water_ml", label: "آب", unit: "ml", icon: "💧", color: "#06b6d4" },
  ];

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="glass p-4 text-center">
        <div className="text-5xl mb-2">🍎</div>
        <h2 className="text-xl font-extrabold text-slate-800 gradient-text">
          وضعیت تغذیه امروز
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {new Date().toLocaleDateString("fa-IR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Macro Cards */}
          <div className="grid grid-cols-2 gap-3">
            {MACROS.map((m) => {
              const value = summary[m.key as keyof DailySummary] || 0;
              return (
                <div
                  key={m.key}
                  className="glass p-4 flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-sm text-slate-500">{m.label}</span>
                  <span className="text-xl font-extrabold text-slate-800">
                    {typeof value === "number" && value % 1 !== 0
                      ? value.toFixed(1)
                      : value}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.unit}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/food"
              className="glass p-4 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
            >
              <span className="text-2xl">🍽️</span>
              <p className="text-sm font-bold text-slate-700 mt-1">ثبت غذا</p>
              <p className="text-[10px] text-slate-400">غذای امروز را ثبت کنید</p>
            </Link>
            <Link
              href="/dashboard/log"
              className="glass p-4 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
            >
              <span className="text-2xl">📝</span>
              <p className="text-sm font-bold text-slate-700 mt-1">ثبت روزانه</p>
              <p className="text-[10px] text-slate-400">قدم‌ها، وزن، خواب</p>
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <span className="text-5xl">🍎</span>
          <p className="mt-3 text-slate-500">اطلاعات تغذیه امروز در دسترس نیست.</p>
        </div>
      )}
    </div>
  );
}