"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Row = {
  id: string;
  name: string | null;
  work_dates: string[] | null;
  next_work_date: string | null;
};

function getMonthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // Monday start
  const weeks: Date[][] = [];
  let d = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function CalendarPage() {
  const supabase = useMemo(() => createClient(), []);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,name,work_dates,next_work_date");
      if (!error) setRows(data as Row[]);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const matrix = getMonthMatrix(year, month);
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const byDate = new Map<string, { id: string; name: string | null }[]>();
  for (const r of rows) {
    const days = new Set<string>();
    (r.work_dates || []).forEach((x) => days.add(x));
    if (r.next_work_date) days.add(r.next_work_date);
    for (const d of days) {
      const arr = byDate.get(d) || [];
      arr.push({ id: r.id, name: r.name });
      byDate.set(d, arr);
    }
  }

  return (
    <div className="min-h-dvh bg-white text-gray-900 p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold">カレンダー</h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded border"
            onClick={() => {
              const m = month - 1;
              if (m < 0) {
                setYear((y) => y - 1);
                setMonth(11);
              } else setMonth(m);
            }}
          >
            ← 前月
          </button>
          <div className="px-2 py-2 text-sm">{year}年 {month + 1}月</div>
          <button
            className="px-3 py-2 rounded border"
            onClick={() => {
              const m = month + 1;
              if (m > 11) {
                setYear((y) => y + 1);
                setMonth(0);
              } else setMonth(m);
            }}
          >
            次月 →
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {"月火水木金土日".split("").map((w) => (
            <div key={w} className="p-2 text-center text-xs text-gray-600">{w}</div>
          ))}
          {matrix.flat().map((d, i) => {
            const key = ym(d);
            const inMonth = d.getMonth() === month;
            const items = byDate.get(key) || [];
            return (
              <div key={i} className={`min-h-24 p-1 rounded border ${inMonth ? "bg-white" : "bg-gray-50 text-gray-400"}`}>
                <div className="text-[11px] text-right pr-1">{d.getDate()}</div>
                <div className="flex flex-wrap gap-1">
                  {items.map((it) => (
                    <Link
                      key={it.id}
                      href={`/customers/${it.id}`}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[10px]"
                      title={it.name || "(未設定)"}
                    >
                      ●
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2">
        <Link href="/customers" className="text-sm text-blue-600">← 顧客一覧へ戻る</Link>
      </div>
    </div>
  );
}


