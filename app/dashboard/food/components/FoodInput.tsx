"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface PendingQuestion {
  question: string;
  food_index: number;
  original_name_fa: string;
  original_name_en: string;
  meal_type: string;
  estimated_grams: number;
  choices: Array<{
    food_id: string;
    description: string;
    calories_per_100g: number;
    category: string;
  }>;
}

interface FoodInputProps {
  onFoodSaved: () => void;
}

export default function FoodInput({ onFoodSaved }: FoodInputProps) {
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    message: string;
    saved_foods?: Array<{ food_name: string; calories: number; serving_grams?: number }>;
    saved_drinks?: Array<{ name: string; amount_ml: number }>;
    pending_questions?: PendingQuestion[];
    total_foods?: number;
    total_calories?: number;
    total_water_ml?: number;
  } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const graphApiUrl = process.env.NEXT_PUBLIC_GRAPH_API_URL;

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    if (!graphApiUrl) {
      setError("آدرس API تنظیم نشده است.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("لطفاً وارد حساب کاربری خود شوید");
        setLoading(false);
        return;
      }

      const res = await fetch(`${graphApiUrl}/agent/food-breakdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, text }),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        if (json.data.status === "saved") {
          // Small delay to ensure DB write is committed before refetch
          setTimeout(() => onFoodSaved(), 300);
        }
      } else {
        setError(json.error || "متأسفانه تحلیل غذا با مشکل مواجه شد.");
      }
    } catch {
      setError("خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveChoice(questionIndex: number, selectedFoodId: string) {
    // Handle "cancel" - reset everything
    if (selectedFoodId === "__cancel__") {
      handleReset();
      return;
    }
    
    // Handle "none" - remove this question without saving
    if (selectedFoodId === "__none__") {
      setResult((prev) => {
        if (!prev) return null;
        const remainingQuestions = (prev.pending_questions || []).filter(
          (q) => q.food_index !== questionIndex
        );
        return {
          ...prev,
          status: remainingQuestions.length > 0 ? "questions_pending" : "saved",
          pending_questions: remainingQuestions.length > 0 ? remainingQuestions : undefined,
          message: remainingQuestions.length > 0
            ? `${remainingQuestions.length} مورد دیگر نیاز به انتخاب دارد`
            : prev.message,
        };
      });
      if (!result?.pending_questions || (result.pending_questions || []).length <= 1) {
        onFoodSaved();
      }
      return;
    }

    setResolving(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`${graphApiUrl}/agent/food-breakdown-resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          text,
          choices: [{ food_index: questionIndex, selected_food_id: selectedFoodId }],
          pending_questions: result?.pending_questions || [],
        }),
      });

      const json = await res.json();
      if (json.success) {
        setResult((prev) => {
          if (!prev) return json.data;
          const existingSaved = prev.saved_foods || [];
          const newSaved = json.data.saved_foods || [];
          const remainingQuestions = (prev.pending_questions || []).filter(
            (q) => q.food_index !== questionIndex
          );
          return {
            ...prev,
            status: remainingQuestions.length > 0 ? "questions_pending" : "saved",
            saved_foods: [...existingSaved, ...newSaved],
            pending_questions: remainingQuestions.length > 0 ? remainingQuestions : undefined,
            message: remainingQuestions.length > 0
              ? `${remainingQuestions.length} مورد دیگر نیاز به انتخاب دارد`
              : `✅ مجموعاً ${existingSaved.length + newSaved.length} ماده غذایی ثبت شد`,
          };
        });
        
        if (!result?.pending_questions || (result.pending_questions.length <= 1)) {
          setTimeout(() => onFoodSaved(), 300);
        }
      } else {
        setError(json.error || "خطا در ثبت انتخاب");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setResolving(false);
    }
  }

  function handleReset() {
    setText("");
    setResult(null);
    setShowInput(false);
    setError("");
    onFoodSaved();
  }

  return (
    <div className="space-y-3">
      {/* + Button (default state) */}
      {!showInput && !result && (
        <button
          onClick={() => setShowInput(true)}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl font-bold text-white shadow-lg shadow-emerald-400/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-emerald-400/40 active:scale-95"
        >
          +
        </button>
      )}

      {/* Input area */}
      {(showInput || result) && (
        <div className="glass p-4 space-y-3">
          {!result ? (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اینجا بنویسید چی خوردید... مثلاً: ناهار ماهی سالسا با سالاد کاهو و آب خوردم"
                rows={4}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !text.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      در حال تحلیل...
                    </span>
                  ) : (
                    "🧠 تحلیل با هوش مصنوعی"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowInput(false);
                    setText("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
                >
                  انصراف
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success/Result message */}
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-100">
                {result.message}
              </div>

              {/* Show saved foods summary */}
              {result.saved_foods && result.saved_foods.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.saved_foods.map((food, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-white/60"
                    >
                      <span className="font-medium text-slate-700">
                        {food.food_name}
                      </span>
                      <span className="text-slate-500">
                        {food.serving_grams ? `${food.serving_grams}g` : ""}{" "}
                        {food.calories} kcal
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending questions - multiple choice buttons */}
              {result.pending_questions && result.pending_questions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-amber-700">
                    ⚠️ نیاز به انتخاب شما:
                  </p>
                  {result.pending_questions.map((q) => (
                    <div key={q.food_index} className="space-y-1.5">
                      <p className="text-xs text-slate-600">{q.question}</p>
                      <div className="grid gap-1.5">
                        {q.choices.map((choice) => (
                          <button
                            key={choice.food_id}
                            onClick={() => handleResolveChoice(q.food_index, choice.food_id)}
                            disabled={resolving}
                            className="text-right px-3 py-2 rounded-lg bg-white/70 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-xs transition-all disabled:opacity-50"
                          >
                            <span className="font-medium text-slate-800">
                              {choice.description}
                            </span>
                            <span className="text-slate-400 mr-2">
                              ({choice.calories_per_100g} kcal/100g)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total summary */}
              {result.total_foods !== undefined && result.status === "saved" && (
                <div className="text-center">
                  <span className="text-2xl">✅</span>
                  <p className="text-sm font-bold text-emerald-700 mt-1">
                    {result.total_foods} ماده غذایی ثبت شد
                  </p>
                  {result.total_calories !== undefined && (
                    <p className="text-xs text-emerald-500">
                      مجموع: {result.total_calories} kcal
                      {result.total_water_ml ? ` | ${result.total_water_ml}ml 💧` : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98]"
                >
                  ✅ ثبت شد - ثبت غذای جدید
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}