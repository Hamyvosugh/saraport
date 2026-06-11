"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";
import FoodRow from "./FoodRow";
import FoodDetailModal from "./FoodDetailModal";
import EditFoodModal from "./EditFoodModal";

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

interface FoodListProps {
  refreshKey: number;
  onListChanged: () => void;
}

export default function FoodList({ refreshKey, onListChanged }: FoodListProps) {
  const [foods, setFoods] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailFood, setDetailFood] = useState<FoodLogEntry | null>(null);
  const [editFood, setEditFood] = useState<FoodLogEntry | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let cancelled = false;
    async function fetchFoods() {
      setLoading(true);
      const supabase = supabaseRef.current;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setLoading(false); return; }
        
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
          .from("food_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", today)
          .order("logged_at", { ascending: false });

        if (!cancelled) {
          setFoods(data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFoods();
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function handleDelete(foodId: string) {
    const supabase = supabaseRef.current;
    const { error } = await supabase.from("food_logs").delete().eq("id", foodId);
    if (!error) {
      setFoods((prev) => prev.filter((f) => f.id !== foodId));
      onListChanged();
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl">🍽️</span>
        <p className="mt-2 text-sm text-slate-400">
          هنوز غذایی ثبت نکردی!
        </p>
        <p className="text-xs text-slate-300 mt-1">
          روی دکمه + بزن و غذایی که خوردی رو بنویس
        </p>
      </div>
    );
  }

  // Group foods by meal_type
  const grouped: Record<string, FoodLogEntry[]> = {};
  for (const food of foods) {
    const type = food.meal_type || "snack";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(food);
  }

  const MEAL_LABELS: Record<string, string> = {
    breakfast: "🌅 صبحانه",
    lunch: "☀️ ناهار",
    dinner: "🌙 شام",
    snack: "🍪 میان‌وعده",
  };

  const order = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="space-y-4">
      {order.map((type) => {
        const items = grouped[type];
        if (!items?.length) return null;

        return (
          <div key={type}>
            <h4 className="text-xs font-bold text-slate-500 mb-2 px-1">
              {MEAL_LABELS[type] || type}
            </h4>
            <div className="space-y-2">
              {items.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  onEdit={() => setEditFood(food)}
                  onDelete={() => handleDelete(food.id)}
                  onDetail={() => setDetailFood(food)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Detail Modal */}
      {detailFood && (
        <FoodDetailModal
          food={detailFood}
          onClose={() => setDetailFood(null)}
        />
      )}

      {/* Edit Modal */}
      {editFood && (
        <EditFoodModal
          food={editFood}
          onClose={() => setEditFood(null)}
          onSaved={onListChanged}
        />
      )}
    </div>
  );
}