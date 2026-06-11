import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="py-4">
      <h2 className="text-xl font-extrabold text-slate-800 gradient-text">تنظیمات</h2>
      <div className="glass mt-4 p-4">
        <p className="text-sm font-bold text-slate-800">پروفایل</p>
        <div className="mt-3 space-y-2 text-sm">
          <Row l="نام" v={p?.full_name || "—"} />
          <Row l="ایمیل" v={user.email || "—"} />
          <Row l="سن" v={p?.age ? String(p.age) : "—"} />
          <Row l="جنسیت" v={p?.gender === "male" ? "مرد" : p?.gender === "female" ? "زن" : p?.gender || "—"} />
          <Row l="قد" v={p?.height_cm ? `${p.height_cm} سانتی‌متر` : "—"} />
          <Row l="وزن" v={p?.weight_kg ? `${p.weight_kg} کیلوگرم` : "—"} />
          <Row l="دور کمر" v={p?.waist_cm ? `${p.waist_cm} سانتی‌متر` : "—"} />
          <Row l="فعالیت" v={p?.activity_level || "—"} />
          <Row l="رژیم" v={p?.diet_preferences || "—"} />
          <Row l="محدودیت‌ها" v={p?.limitations || "—"} />
        </div>
      </div>
      <div className="mt-3">
        <Link href="/dashboard/onboarding"
          className="glass flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:scale-[1.02] active:scale-95">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          ویرایش پروفایل
        </Link>
      </div>
      <div className="mt-3"><LogoutButton /></div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-medium text-slate-800">{v}</span></div>;
}