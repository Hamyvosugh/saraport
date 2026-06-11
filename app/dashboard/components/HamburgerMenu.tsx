"use client";

import { useState } from "react";
import Link from "next/link";

const MENU_ITEMS = [
  { href: "/dashboard", label: "🏠 خانه", description: "داشبورد اصلی" },
  { href: "/dashboard/nutrition", label: "🍎 تغذیه", description: "وضعیت تغذیه روزانه" },
  { href: "/dashboard/food", label: "🍽️ غذا", description: "ثبت و گزارش غذا" },
  { href: "/dashboard/log", label: "📝 ثبت روزانه", description: "ثبت لاگ روزانه" },
  { href: "/dashboard/chat", label: "🧑‍⚕️ مربی", description: "گفتگو با مربی هوش مصنوعی" },
  { href: "/dashboard/progress", label: "📈 پیشرفت", description: "گزارش روند پیشرفت" },
  { href: "/dashboard/settings", label: "⚙️ تنظیمات", description: "تنظیمات حساب کاربری" },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 border border-slate-200/60 text-slate-500 hover:text-emerald-600 hover:bg-white transition-all"
        aria-label="منو"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all"
          onClick={() => setOpen(false)}
        >
          {/* Drawer */}
          <div
            className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">
                <span className="gradient-text">ساراپورت</span>
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-3 space-y-1 overflow-y-auto">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-emerald-50 transition-all group"
                >
                  <span className="text-lg flex-shrink-0">{item.label.split(" ")[0]}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">
                      {item.label.split(" ").slice(1).join(" ")}
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-emerald-400">
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
              <p className="text-center text-[10px] text-slate-300">
                v0.2.0 — ساراپورت همراه سلامت شما
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}