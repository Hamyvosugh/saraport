"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

type Period = 7 | 10 | 30 | 90 | 365;

interface AggregationData {
  totals: Record<string, number>;
  averages: Record<string, number>;
  days_count: number;
  entries_count: number;
}

interface NutrientDef {
  key: string;
  label: string;
  unit: string;
  defaultMin: number;
  defaultMax: number;
}

const ALL_NUTRIENTS: NutrientDef[] = [
  { key: "calories", label: "کالری", unit: "kcal", defaultMin: 1500, defaultMax: 2500 },
  { key: "protein_g", label: "پروتئین", unit: "g", defaultMin: 50, defaultMax: 150 },
  { key: "carbs_g", label: "کربوهیدرات", unit: "g", defaultMin: 150, defaultMax: 350 },
  { key: "fat_g", label: "چربی", unit: "g", defaultMin: 40, defaultMax: 90 },
  { key: "fiber_g", label: "فیبر", unit: "g", defaultMin: 20, defaultMax: 40 },
  { key: "sugar_g", label: "قند", unit: "g", defaultMin: 10, defaultMax: 60 },
  { key: "sodium_mg", label: "سدیم", unit: "mg", defaultMin: 500, defaultMax: 3000 },
  { key: "potassium_mg", label: "پتاسیم", unit: "mg", defaultMin: 2000, defaultMax: 5000 },
  { key: "calcium_mg", label: "کلسیم", unit: "mg", defaultMin: 500, defaultMax: 1500 },
  { key: "iron_mg", label: "آهن", unit: "mg", defaultMin: 8, defaultMax: 30 },
  { key: "magnesium_mg", label: "منیزیم", unit: "mg", defaultMin: 200, defaultMax: 500 },
  { key: "phosphorus_mg", label: "فسفر", unit: "mg", defaultMin: 500, defaultMax: 1500 },
  { key: "zinc_mg", label: "روی", unit: "mg", defaultMin: 5, defaultMax: 20 },
  { key: "selenium_mcg", label: "سلنیوم", unit: "mcg", defaultMin: 30, defaultMax: 100 },
  { key: "cholesterol_mg", label: "کلسترول", unit: "mg", defaultMin: 0, defaultMax: 300 },
  { key: "saturated_fat_g", label: "چربی اشباع", unit: "g", defaultMin: 0, defaultMax: 30 },
  { key: "monounsaturated_fat_g", label: "چربی تک‌غیراشباع", unit: "g", defaultMin: 0, defaultMax: 50 },
  { key: "polyunsaturated_fat_g", label: "چربی چندغیراشباع", unit: "g", defaultMin: 0, defaultMax: 25 },
  { key: "vitamin_a_mcg", label: "ویتامین A", unit: "mcg", defaultMin: 500, defaultMax: 3000 },
  { key: "vitamin_c_mg", label: "ویتامین C", unit: "mg", defaultMin: 40, defaultMax: 200 },
  { key: "vitamin_d_mcg", label: "ویتامین D", unit: "mcg", defaultMin: 5, defaultMax: 50 },
  { key: "vitamin_e_mg", label: "ویتامین E", unit: "mg", defaultMin: 5, defaultMax: 30 },
  { key: "vitamin_k_mcg", label: "ویتامین K", unit: "mcg", defaultMin: 30, defaultMax: 200 },
  { key: "vitamin_b1_mg", label: "ویتامین B1", unit: "mg", defaultMin: 0.5, defaultMax: 5 },
  { key: "vitamin_b2_mg", label: "ویتامین B2", unit: "mg", defaultMin: 0.5, defaultMax: 5 },
  { key: "vitamin_b3_mg", label: "ویتامین B3", unit: "mg", defaultMin: 8, defaultMax: 40 },
  { key: "vitamin_b6_mg", label: "ویتامین B6", unit: "mg", defaultMin: 0.5, defaultMax: 10 },
  { key: "vitamin_b12_mcg", label: "ویتامین B12", unit: "mcg", defaultMin: 1, defaultMax: 10 },
];

const PERIODS: { days: Period; label: string }[] = [
  { days: 7, label: "۷ روز" },
  { days: 10, label: "۱۰ روز" },
  { days: 30, label: "۳۰ روز" },
  { days: 90, label: "۹۰ روز" },
  { days: 365, label: "سالیانه" },
];

export default function NutritionTrends() {
  const [period, setPeriod] = useState<Period>(7);
  const [data, setData] = useState<AggregationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterToday, setWaterToday] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Calculate date range
        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - period);

        const toDateStr = today.toISOString().split("T")[0];
        const fromDateStr = fromDate.toISOString().split("T")[0];

        // Fetch food_logs for the period directly from Supabase
        const { data: logs } = await supabase
          .from("food_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("log_date", fromDateStr)
          .lte("log_date", toDateStr)
          .order("log_date", { ascending: false });

        const numericCols = ALL_NUTRIENTS.map((n) => n.key);
        const totals: Record<string, number> = {};
        for (const col of numericCols) totals[col] = 0;

        if (logs) {
          for (const log of logs) {
            for (const col of numericCols) {
              totals[col] += log[col] || 0;
            }
          }
        }

        const days = new Set(logs?.map((l) => l.log_date) || []).size || 1;
        const averages: Record<string, number> = {};
        for (const col of numericCols) {
          averages[col] = Math.round((totals[col] / days) * 100) / 100;
        }

        setData({
          totals,
          averages,
          days_count: days,
          entries_count: logs?.length || 0,
        });

        // Water today
        const { data: waterLogs } = await supabase
          .from("water_logs")
          .select("amount_ml")
          .eq("user_id", user.id)
          .gte("logged_at", `${toDateStr}T00:00:00`)
          .lte("logged_at", `${toDateStr}T23:59:59`);

        setWaterToday(
          waterLogs?.reduce((sum, w) => sum + (w.amount_ml || 0), 0) || 0
        );
      } catch (e) {
        console.error("Failed to fetch trends:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [period, supabase]);

  function formatValue(value: number): string {
    if (value === 0) return "۰";
    return value % 1 !== 0 ? value.toFixed(1) : value.toString();
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setPeriod(p.days)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              period === p.days
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-white/60 border border-slate-200 text-slate-500 hover:bg-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-2">
          {/* Summary */}
          <div className="text-center py-2">
            <span className="text-xs text-slate-400">
              {data.days_count} روز | {data.entries_count} وعده ثبت شده
            </span>
          </div>

          {/* Water row */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-cyan-50/60 border border-cyan-100">
            <span className="text-sm font-medium text-cyan-700">💧 آب امروز</span>
            <span className="text-sm font-bold text-cyan-800">
              {waterToday}
              <span className="text-[10px] text-cyan-500 mr-1">ml</span>
            </span>
          </div>

          {/* All nutrients */}
          {ALL_NUTRIENTS.map((n) => {
            const avg = data.averages[n.key] || 0;
            if (avg === 0 && n.key !== "calories") return null;

            const pctOfMax = Math.min((avg / n.defaultMax) * 100, 100);
            const isLow = avg < n.defaultMin;
            const isHigh = avg > n.defaultMax;

            return (
              <div
                key={n.key}
                className="py-2.5 px-3 rounded-xl bg-white/70 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-700">{n.label}</span>
                  <span
                    className={`text-sm font-bold ${
                      isLow ? "text-amber-600" : isHigh ? "text-red-600" : "text-slate-800"
                    }`}
                  >
                    {formatValue(avg)}
                    <span className="text-[10px] text-slate-400 mr-1">{n.unit}/day</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                      isLow
                        ? "bg-amber-400"
                        : isHigh
                        ? "bg-red-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${pctOfMax}%` }}
                  />
                </div>
                {/* Min/Max labels */}
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-300">
                  <span>حداقل: {n.defaultMin}</span>
                  <span>حداکثر: {n.defaultMax}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-slate-400">
          داده‌ای برای این بازه زمانی یافت نشد.
        </div>
      )}
    </div>
  );
}