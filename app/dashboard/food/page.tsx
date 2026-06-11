"use client";

import { useState, useCallback } from "react";
import DailyBillboard from "./components/DailyBillboard";
import FoodInput from "./components/FoodInput";
import WaterTracker from "./components/WaterTracker";
import FoodList from "./components/FoodList";
import NutritionTrends from "./components/NutritionTrends";

export default function FoodPage() {
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [billboardRefreshKey, setBillboardRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"today" | "trends">("today");

  const handleFoodSaved = useCallback(() => {
    setListRefreshKey((k) => k + 1);
    setBillboardRefreshKey((k) => k + 1);
  }, []);

  const handleListChanged = useCallback(() => {
    setBillboardRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="py-4 space-y-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800 gradient-text">
          🍽️ ثبت غذای روزانه
        </h2>
      </div>

      {/* Daily Billboard */}
      <DailyBillboard key={`billboard-${billboardRefreshKey}`} refreshKey={billboardRefreshKey} />

      {/* Food Input (the + button) */}
      <FoodInput onFoodSaved={handleFoodSaved} />

      {/* Water Tracker */}
      <WaterTracker onWaterAdded={handleListChanged} />

      {/* Tab Switcher: Today's Foods | Nutrition Trends */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "today"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          📋 وعده‌های امروز
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "trends"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          📊 روند تغذیه
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "today" ? (
        <FoodList
          key={`foodlist-${listRefreshKey}`}
          refreshKey={listRefreshKey}
          onListChanged={handleListChanged}
        />
      ) : (
        <NutritionTrends />
      )}

      {/* Bottom spacing for nav */}
      <div className="h-4" />
    </div>
  );
}