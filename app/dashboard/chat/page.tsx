"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface Message {
  id: string; role: string; content: string; created_at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const graphApiUrl = process.env.NEXT_PUBLIC_GRAPH_API_URL;

  useEffect(() => { loadMessages(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("coach_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    if (data) setMessages(data);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("احراز هویت نشده."); return; }

    const { data: inserted, error: insErr } = await supabase.from("coach_messages").insert({ user_id: user.id, role: "user", content: input.trim() }).select().single();
    if (insErr) { setError(insErr.message); return; }
    if (inserted) setMessages((prev) => [...prev, inserted]);
    setInput(""); setLoading(true);

    try {
      const res = await fetch(`${graphApiUrl}/agent/coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, message: input.trim() }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "پاسخی دریافت نشد.",
        created_at: new Date().toISOString(),
      }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError("خطا در ارتباط با مربی هوشمند.");
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ خطا در ارتباط با هوش مصنوعی.\n\n(${msg})`,
        created_at: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-1 flex-col -mx-3">
      {!graphApiUrl && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 border border-amber-100 text-center">
          ⚠️ اتصال به هوش مصنوعی فعال نیست. کلید NEXT_PUBLIC_GRAPH_API_URL را تنظیم کنید.
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-400/20">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-slate-400">با مربی سلامت خود گفتگو را شروع کنید</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "glass text-slate-700"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass max-w-[80%] rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="glass mx-3 mb-3 p-1 flex gap-2">
        {error && <p className="absolute -top-6 text-xs text-red-500">{error}</p>}
        <input type="text" value={input} onChange={(e) => { setInput(e.target.value); setError(""); }}
          placeholder="پیام خود را بنویسید..."
          className="flex-1 rounded-xl bg-transparent px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none" />
        <button type="submit" disabled={loading || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700 active:scale-95 disabled:opacity-50">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}