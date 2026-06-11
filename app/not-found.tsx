import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{
          background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
        }}>
          <div className="glass p-8 text-center max-w-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-400/20">
              <span className="text-3xl font-black text-white">۴۰۴</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800">صفحه پیدا نشد</h1>
            <p className="mt-2 text-sm text-slate-500">متأسفانه صفحه‌ای که به دنبالش هستی وجود نداره.</p>
            <Link href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 active:scale-95">
              بازگشت به داشبورد
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
