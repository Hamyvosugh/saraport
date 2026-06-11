"use client";

import { useState } from "react";

interface FoodLogEntry {
  id: string;
  food_name: string;
  meal_type?: string;
  quantity?: number;
  unit?: string;
  serving_grams?: number;
  logged_at?: string;
  log_date?: string;
  calories?: number;
  [key: string]: unknown;
}

interface FoodRowProps {
  food: FoodLogEntry;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
}

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍪",
};

export default function FoodRow({ food, onEdit, onDelete, onDetail }: FoodRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const timeStr = food.logged_at
    ? new Date(food.logged_at).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const mealEmoji = MEAL_EMOJIS[food.meal_type || ""] || "🍽️";

  return (
    <div className="flex items-center gap-2.5 py-3 px-3 rounded-xl bg-white/70 border border-slate-100 hover:border-emerald-200 transition-all">
      {/* Meal type emoji */}
      <div className="text-lg flex-shrink-0 w-8 text-center">{mealEmoji}</div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-800 truncate">
          {food.food_name}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
          {food.serving_grams && <span>{food.serving_grams}g</span>}
          {timeStr && <span>🕐 {timeStr}</span>}
          {food.calories && <span>🔥 {food.calories}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!showDeleteConfirm ? (
          <>
            <button
              onClick={onDetail}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs"
              title="اطلاعات بیشتر"
            >
              ℹ️
            </button>
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs"
              title="ویرایش"
            >
              ✏️
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs"
              title="حذف"
            >
              🗑
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1 animate-in">
            <span className="text-[10px] text-red-500">حذف؟</span>
            <button
              onClick={() => {
                setDeleting(true);
                onDelete();
              }}
              disabled={deleting}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white text-xs hover:bg-red-600"
            >
              {deleting ? "⏳" : "✓"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-xs hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}