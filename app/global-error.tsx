"use client";

export default function GlobalError() {
  // Prevent SSR — global-error must be client-rendered only
  if (typeof window === "undefined") return null;

  return (
    <html lang="fa" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{
          background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)",
        }}>
          <div className="glass p-8 text-center max-w-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 to-red-500 shadow-lg shadow-red-400/20">
              <span className="text-3xl text-white">⚠️</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800">خطایی رخ داد</h1>
            <p className="mt-2 text-sm text-slate-500">متأسفانه مشکلی پیش اومده. لطفاً دوباره تلاش کن.</p>
            <a href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:from-red-600 hover:to-red-700 active:scale-95">
              بازگشت به داشبورد
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}