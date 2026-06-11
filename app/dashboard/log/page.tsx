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

interface Option {
  value: string;
  label: string;
  unit: string;
}

const MEASUREMENT_OPTIONS: Option[] = [
  { value: "morning_weight", label: "وزن صبح", unit: "kg" },
  { value: "evening_weight", label: "وزن شب", unit: "kg" },
  { value: "morning_waist", label: "دور کمر صبح", unit: "cm" },
  { value: "evening_waist", label: "دور کمر شب", unit: "cm" },
];

const ACTIVITY_OPTIONS: Option[] = [
  { value: "steps", label: "قدم‌ها", unit: "قدم" },
  { value: "exercise", label: "ورزش", unit: "دقیقه" },
  { value: "elevation", label: "ارتفاع‌روی", unit: "متر" },
];

const ALL_OPTIONS: Option[] = [...MEASUREMENT_OPTIONS, ...ACTIVITY_OPTIONS];

function getOption(entry_type: string): Option | undefined {
  return ALL_OPTIONS.find((o) => o.value === entry_type);
}

function getUnit(entry_type: string): string {
  return getOption(entry_type)?.unit ?? "";
}

function getLabel(entry_type: string): string {
  return getOption(entry_type)?.label ?? entry_type;
}

function isMeasurement(entry_type: string): boolean {
  return MEASUREMENT_OPTIONS.some((o) => o.value === entry_type);
}

function isActivity(entry_type: string): boolean {
  return ACTIVITY_OPTIONS.some((o) => o.value === entry_type);
}

// Persian label for category
function categoryLabel(cat: "measurement" | "activity"): string {
  return cat === "measurement" ? "اندازه‌گیری‌ها" : "فعالیت‌ها";
}

// ---- Component ----
export default function LogPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Entries for today
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Form state
  const [category, setCategory] = useState<"measurement" | "activity">("measurement");
  const [entryType, setEntryType] = useState("");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Today's date string (YYYY-MM-DD) based on user's device
  const today = new Date().toISOString().split("T")[0];

  // ---- Auth check ----
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

  // ---- Fetch today's entries ----
  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    setLoadingEntries(true);
    const { data, error: fetchErr } = await supabase
      .from("log_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", today)
      .order("recorded_at", { ascending: false });

    if (!fetchErr && data) {
      setEntries(data as LogEntry[]);
    }
    setLoadingEntries(false);
  }, [userId, today, supabase]);

  useEffect(() => {
    if (authChecked && userId) {
      fetchEntries();
    }
  }, [authChecked, userId, fetchEntries]);

  // ---- Reset type when category changes ----
  useEffect(() => {
    setEntryType("");
    setValue("");
  }, [category]);

  // ---- Get available types for current category ----
  const typeOptions = category === "measurement" ? MEASUREMENT_OPTIONS : ACTIVITY_OPTIONS;
  const selectedUnit = entryType ? getUnit(entryType) : "";

  // ---- Submit new entry ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!entryType) {
      setError("لطفاً نوع داده را انتخاب کنید.");
      return;
    }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setError("لطفاً یک مقدار معتبر وارد کنید.");
      return;
    }

    setSubmitting(true);
    const numValue = Number(value);

    if (isMeasurement(entryType)) {
      // Measurements: upsert — one per day per type
      const existing = entries.find(
        (e) => e.entry_type === entryType && e.category === "measurement"
      );
      if (existing) {
        // Update existing
        const { error: updErr } = await supabase
          .from("log_entries")
          .update({ value: numValue, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updErr) {
          setError(updErr.message);
          setSubmitting(false);
          return;
        }
      } else {
        // Insert new
        const { error: insErr } = await supabase.from("log_entries").insert({
          user_id: userId,
          category: "measurement",
          entry_type: entryType,
          value: numValue,
          unit: selectedUnit,
          log_date: today,
          recorded_at: new Date().toISOString(),
        });
        if (insErr) {
          setError(insErr.message);
          setSubmitting(false);
          return;
        }
      }
    } else {
      // Activities: always insert new
      const { error: insErr } = await supabase.from("log_entries").insert({
        user_id: userId,
        category: "activity",
        entry_type: entryType,
        value: numValue,
        unit: selectedUnit,
        log_date: today,
        recorded_at: new Date().toISOString(),
      });
      if (insErr) {
        setError(insErr.message);
        setSubmitting(false);
        return;
      }
    }

    // Reset form & refresh
    setValue("");
    setEntryType("");
    await fetchEntries();
    setSubmitting(false);
  }

  // ---- Delete entry ----
  async function handleDelete(id: string) {
    const { error: delErr } = await supabase.from("log_entries").delete().eq("id", id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    if (editingId === id) {
      setEditingId(null);
      setEditValue("");
    }
    await fetchEntries();
  }

  // ---- Start editing ----
  function startEdit(entry: LogEntry) {
    setEditingId(entry.id);
    setEditValue(String(entry.value));
  }

  // ---- Save edit ----
  async function saveEdit(id: string) {
    if (!editValue || isNaN(Number(editValue)) || Number(editValue) <= 0) {
      setError("لطفاً یک مقدار معتبر وارد کنید.");
      return;
    }
    const { error: updErr } = await supabase
      .from("log_entries")
      .update({ value: Number(editValue), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setEditingId(null);
    setEditValue("");
    await fetchEntries();
  }

  // ---- Cancel edit ----
  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  // ---- Group entries by category ----
  const measurementEntries = entries.filter((e) => e.category === "measurement");
  const activityEntries = entries.filter((e) => e.category === "activity");

  // Activity totals per type
  const activityTotals: Record<string, number> = {};
  for (const e of activityEntries) {
    activityTotals[e.entry_type] = (activityTotals[e.entry_type] || 0) + e.value;
  }

  // Time formatting
  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!authChecked) {
    return (
      <div className="py-4 flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-xl font-extrabold text-slate-800 gradient-text">گزارش روزانه</h2>
      <p className="mt-1 text-sm text-slate-500">اطلاعات امروزت رو ثبت کن.</p>

      {/* ---- Form ---- */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        {/* Category dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            دسته
          </label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as "measurement" | "activity")
            }
            className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2.5 text-sm text-slate-800 backdrop-blur-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="measurement">📏 اندازه‌گیری‌ها</option>
            <option value="activity">🏃 فعالیت‌ها</option>
          </select>
        </div>

        {/* Entry type dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            نوع
          </label>
          <select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2.5 text-sm text-slate-800 backdrop-blur-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="">-- انتخاب کنید --</option>
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value input */}
        {entryType && (
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              مقدار ({selectedUnit})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`مقدار به ${selectedUnit}...`}
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2.5 text-sm text-slate-800 backdrop-blur-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !entryType}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 active:scale-[0.98]"
        >
          {submitting ? "در حال ذخیره..." : "ثبت"}
        </button>
      </form>

      {/* ---- Today's entries ---- */}
      <div className="mt-8">
        <h3 className="text-base font-bold text-slate-700 mb-3">
          اطلاعات ثبت‌شده امروز
        </h3>

        {loadingEntries ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/40 px-4 py-8 text-center text-sm text-slate-400">
            هنوز اطلاعاتی برای امروز ثبت نشده.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Measurement entries */}
            {measurementEntries.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                  📏 اندازه‌گیری‌ها
                </h4>
                <div className="space-y-1.5">
                  {measurementEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-3 py-2.5"
                    >
                      {editingId === entry.id ? (
                        // Edit mode
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            autoFocus
                          />
                          <span className="text-xs text-slate-400">
                            {getUnit(entry.entry_type)}
                          </span>
                          <button
                            onClick={() => saveEdit(entry.id)}
                            className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-600"
                          >
                            ذخیره
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-300"
                          >
                            لغو
                          </button>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">
                              {getLabel(entry.entry_type)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatTime(entry.recorded_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-600">
                              {entry.value}{" "}
                              <span className="text-xs font-normal text-slate-400">
                                {getUnit(entry.entry_type)}
                              </span>
                            </span>
                            <button
                              onClick={() => startEdit(entry)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-500 transition-colors"
                              title="ویرایش"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="حذف"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity entries with totals */}
            {activityEntries.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                  🏃 فعالیت‌ها
                </h4>
                <div className="space-y-1.5">
                  {activityEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-3 py-2.5"
                    >
                      {editingId === entry.id ? (
                        // Edit mode
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            autoFocus
                          />
                          <span className="text-xs text-slate-400">
                            {getUnit(entry.entry_type)}
                          </span>
                          <button
                            onClick={() => saveEdit(entry.id)}
                            className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-600"
                          >
                            ذخیره
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-300"
                          >
                            لغو
                          </button>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">
                              {getLabel(entry.entry_type)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatTime(entry.recorded_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-600">
                              {entry.value}{" "}
                              <span className="text-xs font-normal text-slate-400">
                                {getUnit(entry.entry_type)}
                              </span>
                            </span>
                            <button
                              onClick={() => startEdit(entry)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-500 transition-colors"
                              title="ویرایش"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="حذف"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Activity totals */}
                  <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
                    <h5 className="text-[11px] font-semibold text-emerald-700 mb-1.5">
                      📊 جمع روزانه
                    </h5>
                    {Object.entries(activityTotals).map(([type, total]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-600">{getLabel(type)}</span>
                        <span className="font-bold text-emerald-700">
                          {total}{" "}
                          <span className="text-xs font-normal text-emerald-500">
                            {getUnit(type)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}