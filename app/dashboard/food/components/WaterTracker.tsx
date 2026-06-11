"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface WaterTrackerProps {
  onWaterAdded: () => void;
}

const GLASS_SIZES = [
  { label: "کوچک", ml: 200, icon: "🥛" },
  { label: "متوسط", ml: 350, icon: "🥤" },
  { label: "بزرگ", ml: 500, icon: "🍺" },
];

const DRINK_TYPES = [
  { label: "آب", icon: "🚰", key: "water" },
  { label: "قهوه", icon: "☕", key: "coffee" },
  { label: "چای", icon: "🍵", key: "tea" },
];

const OTHER_DRINKS = [
  "شیر",
  "آبمیوه",
  "نوشابه",
  "دوغ",
  "شربت",
  "ماءالشعیر",
  "شیر کاکائو",
  "اسموتی",
  "آب معدنی",
  "شیر سویا",
];

export default function WaterTracker({ onWaterAdded }: WaterTrackerProps) {
  const [selectedSize, setSelectedSize] = useState<number>(350);
  const [selectedDrink, setSelectedDrink] = useState<string>("water");
  const [customDrink, setCustomDrink] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function handleAddWater() {
    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const drinkLabel =
        selectedDrink === "other"
          ? customDrink || "نوشیدنی"
          : DRINK_TYPES.find((d) => d.key === selectedDrink)?.label || "نوشیدنی";

      const { error } = await supabase.from("water_logs").insert({
        user_id: user.id,
        amount_ml: selectedSize,
        source: "manual",
        note: drinkLabel,
      });

      if (error) {
        setMessage("❌ خطا در ثبت");
      } else {
        setMessage(`✅ ${drinkLabel} (${selectedSize}ml) ثبت شد`);
        setTimeout(() => onWaterAdded(), 200);
        setTimeout(() => setMessage(""), 2000);
      }
    } catch {
      setMessage("❌ خطا در ارتباط");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass p-4 space-y-3">
      <h4 className="text-sm font-bold text-slate-700">💧 ثبت نوشیدنی</h4>

      {/* Glass size selection */}
      <div>
        <p className="text-[10px] text-slate-400 mb-2">سایز لیوان:</p>
        <div className="flex gap-2">
          {GLASS_SIZES.map((g) => (
            <button
              key={g.ml}
              onClick={() => setSelectedSize(g.ml)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs transition-all ${
                selectedSize === g.ml
                  ? "bg-emerald-100 border-2 border-emerald-400 text-emerald-700 font-bold"
                  : "bg-white/60 border border-slate-200 text-slate-600"
              }`}
            >
              <span className="text-xl">{g.icon}</span>
              <span>{g.label}</span>
              <span className="text-[10px] opacity-60">{g.ml}ml</span>
            </button>
          ))}
        </div>
      </div>

      {/* Drink type selection */}
      <div>
        <p className="text-[10px] text-slate-400 mb-2">نوع نوشیدنی:</p>
        <div className="flex gap-2">
          {DRINK_TYPES.map((d) => (
            <button
              key={d.key}
              onClick={() => {
                setSelectedDrink(d.key);
                setShowCustom(false);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs transition-all ${
                selectedDrink === d.key && !showCustom
                  ? "bg-emerald-100 border-2 border-emerald-400 text-emerald-700 font-bold"
                  : "bg-white/60 border border-slate-200 text-slate-600"
              }`}
            >
              <span className="text-xl">{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setShowCustom(true);
              setSelectedDrink("other");
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs transition-all ${
              showCustom
                ? "bg-emerald-100 border-2 border-emerald-400 text-emerald-700 font-bold"
                : "bg-white/60 border border-slate-200 text-slate-600"
            }`}
          >
            <span className="text-xl">➕</span>
            <span>سایر</span>
          </button>
        </div>
      </div>

      {/* Custom drink selection */}
      {showCustom && (
        <div>
          <div className="grid grid-cols-3 gap-1.5">
            {OTHER_DRINKS.map((drink) => (
              <button
                key={drink}
                onClick={() => {
                  setCustomDrink(drink);
                }}
                className={`py-1.5 px-2 rounded-lg text-[10px] transition-all ${
                  customDrink === drink
                    ? "bg-emerald-100 border border-emerald-400 text-emerald-700 font-bold"
                    : "bg-white/60 border border-slate-100 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {drink}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customDrink}
            onChange={(e) => setCustomDrink(e.target.value)}
            placeholder="نام نوشیدنی دیگر..."
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white/60 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>
      )}

      {/* Add button */}
      <button
        onClick={handleAddWater}
        disabled={saving || (showCustom && !customDrink.trim())}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 active:scale-[0.98]"
      >
        {saving ? "⏳" : `💧 ثبت ${selectedSize}ml`}
      </button>

      {message && (
        <div className="text-xs text-center font-medium text-emerald-600">
          {message}
        </div>
      )}
    </div>
  );
}