"use client";

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
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  potassium_mg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  magnesium_mg?: number;
  phosphorus_mg?: number;
  zinc_mg?: number;
  selenium_mcg?: number;
  cholesterol_mg?: number;
  saturated_fat_g?: number;
  monounsaturated_fat_g?: number;
  polyunsaturated_fat_g?: number;
  vitamin_a_mcg?: number;
  vitamin_c_mg?: number;
  vitamin_d_mcg?: number;
  vitamin_e_mg?: number;
  vitamin_k_mcg?: number;
  vitamin_b1_mg?: number;
  vitamin_b2_mg?: number;
  vitamin_b3_mg?: number;
  vitamin_b6_mg?: number;
  vitamin_b12_mcg?: number;
  source?: string;
  confidence?: number;
  [key: string]: unknown;
}

interface FoodDetailModalProps {
  food: FoodLogEntry;
  onClose: () => void;
}

type NutrientItem = {
  key: string;
  label: string;
  unit: string;
  category: string;
};

const NUTRIENTS: NutrientItem[] = [
  { key: "calories", label: "کالری", unit: "kcal", category: "اصلی" },
  { key: "protein_g", label: "پروتئین", unit: "g", category: "اصلی" },
  { key: "carbs_g", label: "کربوهیدرات", unit: "g", category: "اصلی" },
  { key: "fat_g", label: "چربی", unit: "g", category: "اصلی" },
  { key: "fiber_g", label: "فیبر", unit: "g", category: "اصلی" },
  { key: "sugar_g", label: "قند", unit: "g", category: "اصلی" },
  { key: "sodium_mg", label: "سدیم", unit: "mg", category: "مواد معدنی" },
  { key: "potassium_mg", label: "پتاسیم", unit: "mg", category: "مواد معدنی" },
  { key: "calcium_mg", label: "کلسیم", unit: "mg", category: "مواد معدنی" },
  { key: "iron_mg", label: "آهن", unit: "mg", category: "مواد معدنی" },
  { key: "magnesium_mg", label: "منیزیم", unit: "mg", category: "مواد معدنی" },
  { key: "phosphorus_mg", label: "فسفر", unit: "mg", category: "مواد معدنی" },
  { key: "zinc_mg", label: "روی", unit: "mg", category: "مواد معدنی" },
  { key: "selenium_mcg", label: "سلنیوم", unit: "mcg", category: "مواد معدنی" },
  { key: "cholesterol_mg", label: "کلسترول", unit: "mg", category: "چربی‌ها" },
  { key: "saturated_fat_g", label: "چربی اشباع", unit: "g", category: "چربی‌ها" },
  { key: "monounsaturated_fat_g", label: "چربی تک‌غیراشباع", unit: "g", category: "چربی‌ها" },
  { key: "polyunsaturated_fat_g", label: "چربی چندغیراشباع", unit: "g", category: "چربی‌ها" },
  { key: "vitamin_a_mcg", label: "ویتامین A", unit: "mcg", category: "ویتامین‌ها" },
  { key: "vitamin_c_mg", label: "ویتامین C", unit: "mg", category: "ویتامین‌ها" },
  { key: "vitamin_d_mcg", label: "ویتامین D", unit: "mcg", category: "ویتامین‌ها" },
  { key: "vitamin_e_mg", label: "ویتامین E", unit: "mg", category: "ویتامین‌ها" },
  { key: "vitamin_k_mcg", label: "ویتامین K", unit: "mcg", category: "ویتامین‌ها" },
  { key: "vitamin_b1_mg", label: "ویتامین B1", unit: "mg", category: "ویتامین‌ها" },
  { key: "vitamin_b2_mg", label: "ویتامین B2", unit: "mg", category: "ویتامین‌ها" },
  { key: "vitamin_b3_mg", label: "ویتامین B3", unit: "mg", category: "ویتامین‌ها" },
  { key: "vitamin_b6_mg", label: "ویتامین B6", unit: "mg", category: "ویتامین‌ها" },
  { key: "vitamin_b12_mcg", label: "ویتامین B12", unit: "mcg", category: "ویتامین‌ها" },
];

const CATEGORIES = ["اصلی", "مواد معدنی", "چربی‌ها", "ویتامین‌ها"];

export default function FoodDetailModal({ food, onClose }: FoodDetailModalProps) {
  const servingInfo = food.serving_grams
    ? `${food.serving_grams} گرم`
    : food.quantity
    ? `${food.quantity} ${food.unit || ""}`
    : "";

  const timeStr = food.logged_at
    ? new Date(food.logged_at).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : food.log_date || "";

  function formatValue(value: unknown): string {
    if (value === undefined || value === null) return "—";
    const num = Number(value);
    if (isNaN(num)) return "—";
    if (num === 0) return "۰";
    return num % 1 !== 0 ? num.toFixed(1) : num.toString();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 gradient-text">
              {food.food_name}
            </h3>
            <p className="text-xs text-slate-400">
              {servingInfo} | {timeStr}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Nutrients */}
        <div className="p-4 space-y-4">
          {CATEGORIES.map((cat) => {
            const items = NUTRIENTS.filter((n) => n.category === cat);
            const hasValues = items.some((n) => {
              const v = food[n.key as keyof FoodLogEntry];
              return v !== undefined && v !== null && Number(v) > 0;
            });
            if (!hasValues) return null;

            return (
              <div key={cat}>
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  {cat}
                </h4>
                <div className="space-y-1">
                  {items.map((n) => {
                    const value = food[n.key as keyof FoodLogEntry];
                    return (
                      <div
                        key={n.key}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50"
                      >
                        <span className="text-sm text-slate-700">{n.label}</span>
                        <span className="text-sm font-bold text-slate-800">
                          {formatValue(value)}
                          <span className="text-[10px] text-slate-400 mr-1">
                            {n.unit}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Source & confidence */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            <span>
              منبع: {food.source === "usda_foundation" ? "USDA ✅" : food.source === "ai_decomposed" ? "AI تجزیه شده" : "AI تخمین"}
            </span>
            {food.confidence !== undefined && (
              <span>دقت: {Math.round(Number(food.confidence) * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}