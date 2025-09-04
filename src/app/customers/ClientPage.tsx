"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Customer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  // 追加フィールド
  contract_amount?: number | null; // 金額（任意）
  work_content?: string | null; // 作業内容（任意）
  work_dates?: string[] | null; // 作業日 (date[])
  next_work_date?: string | null; // 次回作業予定日
  note?: string | null;
  created_at?: string;
};

export default function ClientPage() {
  const supabase = useMemo(() => createClient(), []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [price, setPrice] = useState("");
  const [workContent, setWorkContent] = useState("");
  const [workDateInput, setWorkDateInput] = useState("");
  const [workDates, setWorkDates] = useState<string[]>([]);
  const [nextWorkDate, setNextWorkDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select(
        "id,name,phone,email,contract_amount,work_content,work_dates,next_work_date,note,created_at"
      )
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setCustomers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCustomer = async () => {
    setError(null);
    const amount = price.trim() === "" ? undefined : Number(price);
    const payload = {
      name: name.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      contract_amount: Number.isFinite(amount as number) ? (amount as number) : undefined,
      work_content: workContent.trim() || null,
      work_dates: workDates.length > 0 ? workDates : undefined,
      next_work_date: nextWorkDate || null,
      note: note.trim() || null,
    } as const;

    const { error } = await supabase
      .from("customers")
      .insert(payload)
      .select();
    if (error) {
      setError(error.message);
      return;
    }
    await refresh();
    setName("");
    setPhone("");
    setEmail("");
    setPrice("");
    setWorkContent("");
    setWorkDateInput("");
    setWorkDates([]);
    setNextWorkDate("");
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
              placeholder="名前"
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
            <div className="grid grid-cols-2 gap-2">
              <input
                className="h-12 rounded-xl border border-gray-300 px-4 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
                placeholder="金額 (円)"
                inputMode="numeric"
                pattern="[0-9]*"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                type="date"
                className="h-12 rounded-xl border border-gray-300 px-4 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
                value={nextWorkDate}
                onChange={(e) => setNextWorkDate(e.target.value)}
                placeholder="次回作業予定日"
              />
            </div>
            <textarea
              className="min-h-20 rounded-xl border border-gray-300 px-4 py-3 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
              placeholder="作業内容"
              value={workContent}
              onChange={(e) => setWorkContent(e.target.value)}
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  className="h-12 flex-1 rounded-xl border border-gray-300 px-4 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
                  value={workDateInput}
                  onChange={(e) => setWorkDateInput(e.target.value)}
                />
                <button
                  type="button"
                  className="h-12 px-4 rounded-xl border border-gray-300 text-[16px] active:scale-[0.98]"
                  onClick={() => {
                    if (workDateInput && !workDates.includes(workDateInput)) {
                      setWorkDates((prev) => [...prev, workDateInput].sort());
                      setWorkDateInput("");
                    }
                  }}
                >
                  日付追加
                </button>
              </div>
              {workDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {workDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className="px-3 py-1 rounded-full bg-gray-100 text-[14px] text-gray-800 border border-gray-200"
                      onClick={() =>
                        setWorkDates((prev) => prev.filter((x) => x !== d))
                      }
                      title="タップで削除"
                    >
                      {d} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-medium truncate">
                        {c.name || "(未設定)"}
                      </p>
                      <p className="text-[14px] text-gray-600 truncate">
                        {c.phone || "-"} / {c.email || "-"}
                      </p>
                      {typeof c.contract_amount === "number" && (
                        <p className="text-[14px] text-gray-800 mt-1">
                          ¥{c.contract_amount.toLocaleString()}
                        </p>
                      )}
                      {c.work_content && (
                        <p className="text-[14px] text-gray-700 mt-1 line-clamp-2">
                          {c.work_content}
                        </p>
                      )}
                      {c.work_dates && c.work_dates.length > 0 && (
                        <p className="text-[13px] text-gray-600 mt-1">
                          作業日: {c.work_dates.join("・")}
                        </p>
                      )}
                      {c.next_work_date && (
                        <p className="text-[13px] text-gray-600 mt-1">
                          次回: {c.next_work_date}
                        </p>
                      )}
                      {c.note && (
                        <p className="text-[13px] text-gray-600 mt-1 line-clamp-2">
                          {c.note}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}


