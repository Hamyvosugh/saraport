"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";

// ---- Types ----
interface LogEntry {
  id: string;
  category: "measurement" | "activity";
  entry_type: string;
  value: number;
  unit: string | null;
  log_date: string;
  recorded_at: string;
}

interface DailyAggregate {
  date: string;
  morning_weight: number | null;
  evening_weight: number | null;
  morning_waist: number | null;
  evening_waist: number | null;
  steps: number;
  exercise: number;
  elevation: number;
}

type TimeRange = "daily" | "weekly" | "monthly" | "seasonal" | "yearly";

const RANGE_LABELS: Record<TimeRange, string> = {
  daily: "امروز",
  weekly: "هفته اخیر",
  monthly: "ماه اخیر",
  seasonal: "فصل اخیر",
  yearly: "سال اخیر",
};

const RANGE_DAYS: Record<TimeRange, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  seasonal: 90,
  yearly: 365,
};

// ---- Helpers ----
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function aggregateByDay(entries: LogEntry[]): DailyAggregate[] {
  const map = new Map<string, DailyAggregate>();
  const sorted = [...entries].sort(
    (a, b) => a.log_date.localeCompare(b.log_date)
  );

  for (const e of sorted) {
    if (!map.has(e.log_date)) {
      map.set(e.log_date, {
        date: e.log_date,
        morning_weight: null,
        evening_weight: null,
        morning_waist: null,
        evening_waist: null,
        steps: 0,
        exercise: 0,
        elevation: 0,
      });
    }
    const day = map.get(e.log_date)!;
    if (e.entry_type === "morning_weight") day.morning_weight = e.value;
    else if (e.entry_type === "evening_weight") day.evening_weight = e.value;
    else if (e.entry_type === "morning_waist") day.morning_waist = e.value;
    else if (e.entry_type === "evening_waist") day.evening_waist = e.value;
    else if (e.entry_type === "steps") day.steps += e.value;
    else if (e.entry_type === "exercise") day.exercise += e.value;
    else if (e.entry_type === "elevation") day.elevation += e.value;
  }

  return Array.from(map.values());
}

function toPersianDate(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function trend(
  arr: number[]
): { direction: "up" | "down" | "flat"; delta: number; pct: number } {
  if (arr.length < 2) return { direction: "flat", delta: 0, pct: 0 };
  const first = arr[0];
  const last = arr[arr.length - 1];
  const delta = last - first;
  const pct = first !== 0 ? (delta / first) * 100 : 0;
  return {
    direction: delta > 0.01 ? "up" : delta < -0.01 ? "down" : "flat",
    delta: Math.round(delta * 10) / 10,
    pct: Math.round(pct * 10) / 10,
  };
}

const FIELD_META: Record<
  string,
  { label: string; unit: string; color: string; bg: string }
> = {
  morning_weight: {
    label: "وزن صبح",
    unit: "kg",
    color: "#059669",
    bg: "bg-emerald-500",
  },
  evening_weight: {
    label: "وزن شب",
    unit: "kg",
    color: "#047857",
    bg: "bg-emerald-600",
  },
  morning_waist: {
    label: "دور کمر صبح",
    unit: "cm",
    color: "#7c3aed",
    bg: "bg-purple-500",
  },
  evening_waist: {
    label: "دور کمر شب",
    unit: "cm",
    color: "#6d28d9",
    bg: "bg-purple-600",
  },
  steps: { label: "قدم‌ها", unit: "قدم", color: "#2563eb", bg: "bg-blue-500" },
  exercise: {
    label: "ورزش",
    unit: "دقیقه",
    color: "#ea580c",
    bg: "bg-orange-500",
  },
  elevation: {
    label: "ارتفاع‌روی",
    unit: "متر",
    color: "#0891b2",
    bg: "bg-cyan-500",
  },
};

// ---- Helper to access DailyAggregate fields by string key ----
function getField(d: DailyAggregate, field: string): number | null {
  const v = (d as unknown as Record<string, unknown>)[field];
  if (v === null || v === undefined) return null;
  return Number(v);
}

// ---- SVG Line Chart Component ----
function LineChart({
  data,
  field,
  width = 340,
  height = 160,
}: {
  data: DailyAggregate[];
  field: string;
  width?: number;
  height?: number;
}) {
  const meta = FIELD_META[field];
  if (!meta) return null;

  const values = data
    .map((d) => getField(d, field))
    .filter((v) => v != null) as number[];

  if (values.length < 2) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        داده کافی برای نمودار نیست
      </div>
    );
  }

  const points = data
    .map((d, i) => ({
      x: i,
      y: getField(d, field),
    }))
    .filter((p) => p.y != null) as { x: number; y: number }[];

  const min = Math.min(...points.map((p) => p.y));
  const max = Math.max(...points.map((p) => p.y));
  const range = max - min || 1;
  const padX = 20;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const stepX = points.length > 1 ? chartW / (points.length - 1) : chartW;

  const pathD = points
    .map((p, i) => {
      const x = padX + i * stepX;
      const y = padY + chartH - ((p.y - min) / range) * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const trendInfo = trend(values);
  const lastVal = values[values.length - 1];
  const firstVal = values[0];

  return (
    <div className="glass p-3 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600">
          {meta.label}
        </span>
        <span
          className={`text-[10px] font-bold ${
            trendInfo.direction === "down"
              ? "text-emerald-600"
              : trendInfo.direction === "up"
              ? "text-red-500"
              : "text-slate-400"
          }`}
        >
          {trendInfo.direction === "down"
            ? `↓ ${Math.abs(trendInfo.delta)} ${meta.unit}`
            : trendInfo.direction === "up"
            ? `↑ ${trendInfo.delta} ${meta.unit}`
            : "بدون تغییر"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: height }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padY + chartH * (1 - frac);
          return (
            <line
              key={frac}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />
          );
        })}
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={meta.color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Area fill */}
        <path
          d={`${pathD} L ${padX + (points.length - 1) * stepX} ${padY + chartH} L ${padX} ${padY + chartH} Z`}
          fill={meta.color}
          fillOpacity="0.08"
        />
        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={padX + i * stepX}
            cy={padY + chartH - ((p.y - min) / range) * chartH}
            r="3"
            fill="white"
            stroke={meta.color}
            strokeWidth="2"
          />
        ))}
      </svg>
      {/* Labels */}
      <div className="flex justify-between mt-1 text-[9px] text-slate-400">
        <span>
          {toPersianDate(data[0].date)}: {firstVal}
        </span>
        <span>
          {toPersianDate(data[data.length - 1].date)}: {lastVal}
        </span>
      </div>
    </div>
  );
}

// ---- SVG Bar Chart Component ----
function BarChart({
  data,
  field,
  width = 340,
  height = 140,
}: {
  data: DailyAggregate[];
  field: string;
  width?: number;
  height?: number;
}) {
  const meta = FIELD_META[field];
  if (!meta) return null;

  const values = data.map(
    (d) => getField(d, field) || 0
  );
  const total = values.reduce((s, v) => s + v, 0);
  const max = Math.max(...values, 1);
  const padX = 20;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const barW = Math.max(4, chartW / values.length - 2);

  return (
    <div className="glass p-3 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600">
          {meta.label}
        </span>
        <span className="text-[10px] font-bold text-slate-500">
          جمع: {total.toLocaleString()} {meta.unit}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: height }}
      >
        {values.map((v, i) => {
          const barH = (v / max) * chartH;
          const x = padX + i * (chartW / values.length) + 1;
          const y = padY + chartH - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="2"
              fill={meta.color}
              fillOpacity="0.7"
            />
          );
        })}
      </svg>
      <div className="flex justify-between mt-1 text-[9px] text-slate-400">
        <span>{toPersianDate(data[0].date)}</span>
        <span>
          میانگین: {Math.round(avg(values)).toLocaleString()} {meta.unit}
        </span>
      </div>
    </div>
  );
}

// ---- Stats Card ----
function StatsCard({
  label,
  value,
  unit,
  trendInfo,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  trendInfo?: { direction: string; delta: number; pct: number };
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-400 to-emerald-500 shadow-emerald-400/20",
    blue: "from-blue-400 to-blue-500 shadow-blue-400/20",
    purple: "from-purple-400 to-purple-500 shadow-purple-400/20",
    orange: "from-orange-400 to-orange-500 shadow-orange-400/20",
    cyan: "from-cyan-400 to-cyan-500 shadow-cyan-400/20",
  };
  return (
    <div className="glass relative overflow-hidden p-3 rounded-xl">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold text-slate-800">
        {value}
        {unit && (
          <span className="text-xs font-normal text-slate-400 ml-1">
            {unit}
          </span>
        )}
      </p>
      {trendInfo && trendInfo.direction !== "flat" && (
        <p
          className={`text-[10px] font-bold mt-0.5 ${
            trendInfo.direction === "down"
              ? "text-emerald-600"
              : "text-red-500"
          }`}
        >
          {trendInfo.direction === "down" ? "↓" : "↑"} {Math.abs(trendInfo.delta)}{" "}
          {unit}
        </p>
      )}
      <div
        className={`absolute -bottom-1 -left-1 h-1 w-1/2 rounded-full bg-gradient-to-r ${colors[color]} opacity-40`}
      />
    </div>
  );
}

// ---- Main Component ----
export default function ProgressPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setAuthChecked(true);
    });
  }, [supabase, router]);

  // Fetch entries for selected time range
  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const fromDate = daysAgo(RANGE_DAYS[timeRange] - 1);

    const { data, error } = await supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("log_date", fromDate)
      .order("log_date", { ascending: true });

    if (!error && data) {
      setEntries(data as LogEntry[]);
    }
    setLoading(false);
  }, [userId, timeRange, supabase]);

  useEffect(() => {
    if (authChecked && userId) {
      fetchEntries();
    }
  }, [authChecked, userId, timeRange, fetchEntries]);

  if (!authChecked) {
    return (
      <div className="py-4 flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const dailyData = aggregateByDay(entries);

  // Compute stats
  const morningWeights = dailyData
    .map((d) => d.morning_weight)
    .filter((v) => v != null) as number[];
  const morningWaists = dailyData
    .map((d) => d.morning_waist)
    .filter((v) => v != null) as number[];
  const totalSteps = dailyData.reduce((s, d) => s + d.steps, 0);
  const totalExercise = dailyData.reduce((s, d) => s + d.exercise, 0);
  const totalElevation = dailyData.reduce((s, d) => s + d.elevation, 0);

  const weightTrend = trend(morningWeights);
  const waistTrend = trend(morningWaists);
  const avgDailySteps = dailyData.length
    ? Math.round(totalSteps / dailyData.length)
    : 0;

  const tabs: TimeRange[] = [
    "daily",
    "weekly",
    "monthly",
    "seasonal",
    "yearly",
  ];

  return (
    <div className="py-4">
      <h2 className="text-xl font-extrabold text-slate-800 gradient-text">
        پیشرفت
      </h2>
      <p className="mt-1 text-sm text-slate-500">روندها و آمار تو.</p>

      {/* Time Range Tabs */}
      <div className="mt-4 flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setTimeRange(tab)}
            className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition-all ${
              timeRange === tab
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {RANGE_LABELS[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : dailyData.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white/40 px-4 py-10 text-center text-sm text-slate-400">
          داده‌ای برای این بازه زمانی ثبت نشده.
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <StatsCard
              label="وزن صبح"
              value={morningWeights.length ? String(morningWeights[morningWeights.length - 1]) : "—"}
              unit="kg"
              trendInfo={weightTrend}
              color="emerald"
            />
            <StatsCard
              label="دور کمر صبح"
              value={morningWaists.length ? String(morningWaists[morningWaists.length - 1]) : "—"}
              unit="cm"
              trendInfo={waistTrend}
              color="purple"
            />
            <StatsCard
              label="مجموع قدم‌ها"
              value={totalSteps.toLocaleString()}
              unit="قدم"
              color="blue"
            />
            <StatsCard
              label="مجموع ورزش"
              value={totalExercise.toLocaleString()}
              unit="دقیقه"
              color="orange"
            />
          </div>

          {/* Weight Trend Chart */}
          {morningWeights.length >= 2 && (
            <div className="mt-4">
              <LineChart data={dailyData} field="morning_weight" />
            </div>
          )}

          {/* Waist Trend Chart */}
          {morningWaists.length >= 2 && (
            <div className="mt-3">
              <LineChart data={dailyData} field="morning_waist" />
            </div>
          )}

          {/* Steps Bar Chart */}
          {totalSteps > 0 && (
            <div className="mt-3">
              <BarChart data={dailyData} field="steps" />
            </div>
          )}

          {/* Exercise Bar Chart */}
          {totalExercise > 0 && (
            <div className="mt-3">
              <BarChart data={dailyData} field="exercise" />
            </div>
          )}

          {/* Elevation Bar Chart */}
          {totalElevation > 0 && (
            <div className="mt-3">
              <BarChart data={dailyData} field="elevation" />
            </div>
          )}

          {/* Summary Table */}
          <div className="mt-4 glass rounded-xl p-3">
            <h3 className="text-xs font-bold text-slate-600 mb-2">
              📋 خلاصه {RANGE_LABELS[timeRange]}
            </h3>
            <div className="space-y-1.5 text-xs">
              {morningWeights.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">میانگین وزن صبح</span>
                  <span className="font-bold text-slate-700">
                    {avg(morningWeights).toFixed(1)} kg
                  </span>
                </div>
              )}
              {morningWaists.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">میانگین دور کمر صبح</span>
                  <span className="font-bold text-slate-700">
                    {avg(morningWaists).toFixed(1)} cm
                  </span>
                </div>
              )}
              {avgDailySteps > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">میانگین قدم روزانه</span>
                  <span className="font-bold text-slate-700">
                    {avgDailySteps.toLocaleString()} قدم
                  </span>
                </div>
              )}
              {totalExercise > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">کل ورزش</span>
                  <span className="font-bold text-slate-700">
                    {totalExercise.toLocaleString()} دقیقه
                  </span>
                </div>
              )}
              {totalElevation > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">کل ارتفاع‌روی</span>
                  <span className="font-bold text-slate-700">
                    {totalElevation.toLocaleString()} متر
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">روزهای ثبت داده</span>
                <span className="font-bold text-slate-700">
                  {dailyData.length} روز
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}