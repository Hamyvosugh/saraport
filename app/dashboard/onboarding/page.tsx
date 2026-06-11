"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "", age: "", gender: "", height_cm: "", weight_kg: "",
    waist_cm: "", goal_type: "lose_weight", target_weight_kg: "",
    target_waist_cm: "", activity_level: "sedentary", diet_preferences: "", limitations: "",
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("احراز هویت نشده."); setLoading(false); return; }
    const pErr = (await supabase.from("profiles").insert({
      id: user.id, full_name: form.full_name, age: +form.age || null,
      gender: form.gender || null, height_cm: +form.height_cm || null,
      weight_kg: +form.weight_kg || null, waist_cm: +form.waist_cm || null,
      activity_level: form.activity_level, diet_preferences: form.diet_preferences || null,
      limitations: form.limitations || null, onboarding_completed: true,
    })).error;
    if (pErr) { setError(pErr.message); setLoading(false); return; }
    const gErr = (await supabase.from("goals").insert({
      user_id: user.id, goal_type: form.goal_type,
      target_weight_kg: +form.target_weight_kg || null,
      target_waist_cm: +form.target_waist_cm || null, status: "active",
    })).error;
    if (gErr) { setError(gErr.message); setLoading(false); return; }
    router.refresh(); router.push("/dashboard");
  }

  type Opt = { v: string; l: string };
  const F = ({ l: label, f, t = "text", req, ph, st, opts }: { l: string; f: string; t?: string; req?: boolean; ph?: string; st?: string; opts?: Opt[] }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {t === "select" && opts ? (
        <select value={form[f as keyof typeof form]} onChange={(e) => set(f, e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-800 backdrop-blur-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10">
          {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input type={t} value={form[f as keyof typeof form]} onChange={(e) => set(f, e.target.value)} required={req} step={st} placeholder={ph}
          className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10" />
      )}
    </div>
  );

  return (
    <div className="py-4">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 gradient-text">به ساراپورت خوش آمدید</h2>
        <p className="mt-1 text-sm text-slate-500">پروفایل سلامت خود را تکمیل کنید.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <F l="نام کامل" f="full_name" req />
        <div className="grid grid-cols-2 gap-3">
          <F l="سن" f="age" t="number" />
          <F l="جنسیت" f="gender" t="select" opts={[{v:"",l:"انتخاب..."},{v:"male",l:"مرد"},{v:"female",l:"زن"},{v:"other",l:"سایر"}]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F l="قد (سانتی‌متر)" f="height_cm" t="number" st="0.1" />
          <F l="وزن فعلی (کیلوگرم)" f="weight_kg" t="number" st="0.1" />
        </div>
        <F l="سایز کمر (سانتی‌متر)" f="waist_cm" t="number" st="0.1" />
        <F l="نوع هدف" f="goal_type" t="select" opts={[
          {v:"lose_weight",l:"کاهش وزن"},{v:"reduce_waist",l:"کاهش سایز کمر"},
          {v:"build_muscle",l:"عضله‌سازی"},{v:"maintain",l:"حفظ وزن"},{v:"custom",l:"سفارشی"}]} />
        <div className="grid grid-cols-2 gap-3">
          <F l="وزن هدف (کیلوگرم)" f="target_weight_kg" t="number" st="0.1" />
          <F l="کمر هدف (سانتی‌متر)" f="target_waist_cm" t="number" st="0.1" />
        </div>
        <F l="سطح فعالیت" f="activity_level" t="select" opts={[
          {v:"sedentary",l:"کم‌تحرک"},{v:"light",l:"سبک"},{v:"moderate",l:"متوسط"},{v:"active",l:"فعال"},{v:"very_active",l:"بسیار فعال"}]} />
        <F l="ترجیحات غذایی" f="diet_preferences" ph="مثلاً: گیاه‌خوار، حلال، بدون محدودیت" />
        <F l="محدودیت‌های سلامتی" f="limitations" ph="مثلاً: درد زانو، آلرژی، ندارد" />
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">{error}</div>}
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 active:scale-[0.98]">
          {loading ? "در حال ذخیره..." : "تکمیل ثبت‌نام"}
        </button>
      </form>
    </div>
  );
}