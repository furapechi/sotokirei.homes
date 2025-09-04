"use client";
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Customer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  created_at?: string;
};

export default function CustomersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,name,phone,email,note,created_at")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setCustomers(data ?? []);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const addCustomer = async () => {
    setError(null);
    const payload: Record<string, string | null> = {};
    if (name.trim()) payload.name = name.trim();
    if (phone.trim()) payload.phone = phone.trim();
    if (email.trim()) payload.email = email.trim();
    if (note.trim()) payload.note = note.trim();

    if (Object.keys(payload).length === 0) {
      setError("入力がありません");
      return;
    }

    const { data, error } = await supabase
      .from("customers")
      .insert(payload)
      .select();
    if (error) {
      setError(error.message);
      return;
    }
    setCustomers((prev) => [...data!, ...prev]);
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
  };

  return (
    <div className="min-h-dvh bg-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 p-4">
        <h1 className="text-[20px] font-semibold">顧客管理</h1>
      </header>

      <main className="p-4 space-y-4">
        <section className="rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3">
            <input
              className="h-12 rounded-xl border border-gray-300 px-4 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
              placeholder="名前 *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="h-12 rounded-xl border border-gray-300 px-4 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
              placeholder="電話"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className="h-12 rounded-xl border border-gray-300 px-4 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
              placeholder="メール"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              className="min-h-20 rounded-xl border border-gray-300 px-4 py-3 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
              placeholder="メモ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="h-12 rounded-xl bg-black text-white text-[16px] active:scale-[0.98] disabled:opacity-50"
              onClick={addCustomer}
              disabled={loading}
            >
              追加
            </button>
            {error && (
              <p className="text-[14px] text-red-600" role="alert">{error}</p>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-[16px] font-medium">顧客一覧</h2>
          {loading ? (
            <p className="text-gray-500 text-[14px]">読み込み中...</p>
          ) : customers.length === 0 ? (
            <p className="text-gray-500 text-[14px]">まだ登録がありません</p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 overflow-hidden">
              {customers.map((c) => (
                <li key={c.id} className="p-4 active:bg-gray-50">
                  <p className="text-[16px] font-medium">{c.name}</p>
                  <p className="text-[14px] text-gray-600">{c.phone || "-"}</p>
                  <p className="text-[14px] text-gray-600">{c.email || "-"}</p>
                  {c.note && <p className="text-[14px] text-gray-600 mt-1">{c.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}


