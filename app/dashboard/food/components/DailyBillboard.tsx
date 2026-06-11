"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface DailyTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  potassium_mg: number;
  water_ml: number;
}

const EMPTY_TOTALS: DailyTotals = {
  calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
  fiber_g: 0, sugar_g: 0, sodium_mg: 0, potassium_mg: 0, water_ml: 0,
};

const DEFAULT_TARGETS: Record<string, number> = {
  calories: 2000, protein_g: 60, carbs_g: 250, fat_g: 65,
  fiber_g: 25, sugar_g: 50, sodium_mg: 2300, potassium_mg: 3500, water_ml: 2500,
};

const ITEMS: {
  key: keyof DailyTotals; label: string; unit: string; icon: string; color: string;
}[] = [
  { key: "calories", label: "کالری", unit: "kcal", icon: "🔥", color: "#f59e0b" },
  { key: "protein_g", label: "پروتئین", unit: "g", icon: "🥩", color: "#ef4444" },
  { key: "carbs_g", label: "کربوهیدرات", unit: "g", icon: "🍞", color: "#3b82f6" },
  { key: "fat_g", label: "چربی", unit: "g", icon: "🧈", color: "#a855f7" },
  { key: "fiber_g", label: "فیبر", unit: "g", icon: "🥬", color: "#22c55e" },
  { key: "sugar_g", label: "قند", unit: "g", icon: "🍬", color: "#ec4899" },
  { key: "water_ml", label: "آب", unit: "ml", icon: "💧", color: "#06b6d4" },
  { key: "sodium_mg", label: "سدیم", unit: "mg", icon: "🧂", color: "#64748b" },
  { key: "potassium_mg", label: "پتاسیم", unit: "mg", icon: "🍌", color: "#eab308" },
];

export default function DailyBillboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [totals, setTotals] = useState<DailyTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let cancelled = false;
    
    async function fetchToday() {
      setLoading(true);
      const supabase = supabaseRef.current;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { 
          setLoading(false);
          return; 
        }

        const today = new Date().toISOString().split("T")[0];

        // Fetch food_logs for today
        const { data: logs } = await supabase
          .from("food_logs")
          .select("calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, potassium_mg")
          .eq("user_id", user.id)
          .eq("log_date", today);

        const t = { ...EMPTY_TOTALS };
        if (logs) {
          for (const log of logs) {
            t.calories += log.calories || 0;
            t.protein_g += log.protein_g || 0;
            t.carbs_g += log.carbs_g || 0;
            t.fat_g += log.fat_g || 0;
            t.fiber_g += log.fiber_g || 0;
            t.sugar_g += log.sugar_g || 0;
            t.sodium_mg += log.sodium_mg || 0;
            t.potassium_mg += log.potassium_mg || 0;
          }
        }

        // Fetch water_logs for today
        const { data: waterLogs } = await supabase
          .from("water_logs")
          .select("amount_ml")
          .eq("user_id", user.id)
          .gte("logged_at", `${today}T00:00:00`)
          .lte("logged_at", `${today}T23:59:59`);

        t.water_ml = waterLogs?.reduce((sum: number, w: { amount_ml: number }) => sum + (w.amount_ml || 0), 0) || 0;

        if (!cancelled) {
          setTotals(t);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchToday();
    return () => { cancelled = true; };
  }, [refreshKey]); // Refetch when refreshKey changes

  if (loading) {
    return (
      <div className="glass p-4 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-4">
      <h3 className="text-sm font-bold text-slate-700 mb-3">
        📊 وضعیت تغذیه امروز
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {ITEMS.map((item) => {
          const value = totals[item.key] || 0;
          const target = DEFAULT_TARGETS[item.key] || 100;
          const pct = Math.min((value / target) * 100, 100);

          return (
            <div
              key={item.key}
              className="relative overflow-hidden rounded-xl bg-white/50 p-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">{item.icon}</span>
                <span className="text-[10px] font-medium text-slate-500">{item.label}</span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}
              </div>
              <div className="text-[9px] text-slate-400">{item.unit}</div>
              <div
                className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}