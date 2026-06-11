"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface FoodLogEntry {
  id: string;
  food_name: string;
  serving_grams?: number;
  quantity?: number;
  unit?: string;
  logged_at?: string;
  log_date?: string;
  meal_type?: string;
  [key: string]: unknown;
}

interface EditFoodModalProps {
  food: FoodLogEntry;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditFoodModal({ food, onClose, onSaved }: EditFoodModalProps) {
  const supabase = createClient();
  const [date, setDate] = useState(food.log_date || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(() => {
    if (food.logged_at) {
      return new Date(food.logged_at).toTimeString().slice(0, 5);
    }
    return new Date().toTimeString().slice(0, 5);
  });
  const [servingGrams, setServingGrams] = useState(food.serving_grams?.toString() || "100");
  const [quantity, setQuantity] = useState(food.quantity?.toString() || "1");
  const [mealType, setMealType] = useState(food.meal_type || "snack");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const loggedAt = `${date}T${time}:00+02:00`;
      const { error: updateErr } = await supabase
        .from("food_logs")
        .update({
          log_date: date,
          logged_at: loggedAt,
          serving_grams: Number(servingGrams) || 100,
          quantity: Number(quantity) || 1,
          meal_type: mealType,
        })
        .eq("id", food.id);

      if (updateErr) {
        setError(updateErr.message);
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError("خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl p-4 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-800">
            ✏️ ویرایش {food.food_name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        {/* Meal Type */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">نوع وعده</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { key: "breakfast", label: "صبحانه", emoji: "🌅" },
              { key: "lunch", label: "ناهار", emoji: "☀️" },
              { key: "dinner", label: "شام", emoji: "🌙" },
              { key: "snack", label: "میان‌وعده", emoji: "🍪" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMealType(m.key)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  mealType === m.key
                    ? "bg-emerald-100 border-2 border-emerald-400 text-emerald-700"
                    : "bg-slate-50 border border-slate-200 text-slate-500"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">تاریخ مصرف</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">ساعت مصرف</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">مقدار</label>
            <input
              type="number"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">وزن (گرم)</label>
            <input
              type="number"
              value={servingGrams}
              onChange={(e) => setServingGrams(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? "⏳" : "💾 ذخیره تغییرات"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}