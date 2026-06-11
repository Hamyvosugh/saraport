"use client";

import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="glass flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-500 transition-all hover:scale-[1.02] active:scale-95 border-red-200"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      خروج از حساب
    </button>
  );
}