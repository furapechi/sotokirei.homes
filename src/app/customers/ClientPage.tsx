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
  photos_work?: string[] | null; // 作業写真URL配列
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const STORAGE_BUCKET = "customer-photos"; // Supabase Storage バケット名

  const refresh = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select(
        "id,name,phone,email,contract_amount,work_content,work_dates,next_work_date,photos_work,note,created_at"
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
    const rawAmount = price.replace(/,/g, "");
    const amount = rawAmount.trim() === "" ? undefined : Number(rawAmount);
    // 画像アップロード
    let uploadedUrls: string[] = [];
    if (files.length > 0) {
      setUploading(true);
      for (const f of files) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`;
        const { data: up, error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, f, { upsert: false });
        if (upErr) {
          setUploading(false);
          setError(`画像アップロード失敗: ${upErr.message}`);
          return;
        }
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(up!.path);
        if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl);
      }
      setUploading(false);
    }

    const payload = {
      name: name.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      contract_amount: Number.isFinite(amount as number) ? (amount as number) : undefined,
      work_content: workContent.trim() || null,
      work_dates: workDates.length > 0 ? workDates : undefined,
      next_work_date: nextWorkDate || null,
      photos_work: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      note: note.trim() || null,
    } as const;

    const { data: insertedRows, error } = await supabase
      .from("customers")
      .insert(payload)
      .select(
        "id,name,phone,email,contract_amount,work_content,work_dates,next_work_date,photos_work,note,created_at"
      );
    if (error) {
      setError(error.message);
      return;
    }
    if (insertedRows && insertedRows.length > 0) {
      setCustomers((prev) => [insertedRows[0] as Customer, ...prev]);
    } else {
      await refresh();
    }
    setName("");
    setPhone("");
    setEmail("");
    setPrice("");
    setWorkContent("");
    setWorkDateInput("");
    setWorkDates([]);
    setNextWorkDate("");
    setNote("");
    setFiles([]);
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name ?? "");
    setPhone(c.phone ?? "");
    setEmail(c.email ?? "");
    setPrice(
      typeof c.contract_amount === "number" && !Number.isNaN(c.contract_amount)
        ? c.contract_amount.toLocaleString()
        : ""
    );
    setWorkContent(c.work_content ?? "");
    setWorkDates(Array.isArray(c.work_dates) ? c.work_dates : []);
    setNextWorkDate(c.next_work_date ?? "");
    setNote(c.note ?? "");
    setFiles([]);
  };

  const saveEditCustomer = async () => {
    if (!editingId) return;
    setError(null);
    const rawAmount = price.replace(/,/g, "");
    // 既存画像 + 新規アップロード
    let mergedUrls: string[] | undefined = undefined;
    if (files.length > 0) {
      setUploading(true);
      const newly: string[] = [];
      for (const f of files) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`;
        const { data: up, error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, f, { upsert: false });
        if (upErr) {
          setUploading(false);
          setError(`画像アップロード失敗: ${upErr.message}`);
          return;
        }
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(up!.path);
        if (pub?.publicUrl) newly.push(pub.publicUrl);
      }
      setUploading(false);
      const current = customers.find((x) => x.id === editingId)?.photos_work || [];
      mergedUrls = [...current, ...newly];
    }
    const amount = rawAmount.trim() === "" ? undefined : Number(rawAmount);
    const payload = {
      name: name.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      contract_amount: Number.isFinite(amount as number) ? (amount as number) : undefined,
      work_content: workContent.trim() || null,
      work_dates: workDates.length > 0 ? workDates : undefined,
      next_work_date: nextWorkDate || null,
      photos_work: mergedUrls,
      note: note.trim() || null,
    } as const;

    const { error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", editingId)
      .select();
    if (error) {
      setError(error.message);
      return;
    }
    // ローカル反映（即時）
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: payload.name ?? c.name,
              phone: payload.phone ?? c.phone,
              email: payload.email ?? c.email,
              contract_amount:
                payload.contract_amount !== undefined ? payload.contract_amount : c.contract_amount,
              work_content: payload.work_content ?? c.work_content,
              work_dates: payload.work_dates ?? c.work_dates,
              next_work_date: payload.next_work_date ?? c.next_work_date,
              photos_work: mergedUrls ?? c.photos_work,
              note: payload.note ?? c.note,
            }
          : c
      )
    );
    setEditingId(null);
    setName("");
    setPhone("");
    setEmail("");
    setPrice("");
    setWorkContent("");
    setWorkDateInput("");
    setWorkDates([]);
    setNextWorkDate("");
    setNote("");
    setFiles([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
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

  const deleteCustomer = async (id: string) => {
    if (!window.confirm("このデータを削除しますか？")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await refresh();
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
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  const formatted = digits === "" ? "" : Number(digits).toLocaleString();
                  setPrice(formatted);
                }}
              />
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-gray-700">次回作業実施予定日</label>
                <input
                  type="date"
                  className="h-12 rounded-xl border border-gray-300 px-4 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
                  value={nextWorkDate}
                  onChange={(e) => setNextWorkDate(e.target.value)}
                />
                <p className="text-[12px] text-gray-500">例: 次回訪問・作業予定日を1日だけ選択します。</p>
              </div>
            </div>
            <textarea
              className="min-h-20 rounded-xl border border-gray-300 px-4 py-3 text-[16px] focus:outline-none focus:ring-4 focus:ring-gray-200"
              placeholder="作業内容"
              value={workContent}
              onChange={(e) => setWorkContent(e.target.value)}
            />
            <div className="space-y-2">
              <label className="text-[14px] text-gray-700">作業実施日（複数選択可）</label>
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
                      if (workDates.length >= 20) {
                        setError("作業実施日は最大20件までです");
                        return;
                      }
                      setWorkDates((prev) => [...prev, workDateInput].sort());
                      setWorkDateInput("");
                    }
                  }}
                >
                  日付追加
                </button>
              </div>
              <p className="text-[12px] text-gray-500">複数日を登録できます。日付を選んで「日付追加」。表示された日付バッジをタップすると削除できます。</p>
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
            <div className="space-y-2">
              <label className="text-[14px] text-gray-700">作業写真（複数可・最大10枚程度推奨）</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {uploading && <p className="text-[12px] text-gray-500">アップロード中...</p>}
              {files.length > 0 && (
                <div className="grid grid-cols-4 gap-1">
                  {files.slice(0, 8).map((f) => (
                    <img
                      key={f.name + f.size}
                      src={URL.createObjectURL(f)}
                      alt="preview"
                      className="w-full h-14 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="h-12 rounded-xl bg-black text-white text-[16px] active:scale-[0.98] disabled:opacity-50"
                onClick={editingId ? saveEditCustomer : addCustomer}
                disabled={loading}
              >
                {editingId ? "更新" : "追加"}
              </button>
              {editingId && (
                <button
                  className="h-12 rounded-xl border border-gray-300 text-[16px] active:scale-[0.98]"
                  type="button"
                  onClick={cancelEdit}
                >
                  キャンセル
                </button>
              )}
            </div>
            {error && (
              <p className="text-[14px] text-red-600" role="alert">{error}</p>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-medium">顧客一覧</h2>
            <a
              href="/calendar"
              className="h-10 px-4 rounded-xl border border-gray-300 text-[14px] flex items-center"
            >
              カレンダースケジュール
            </a>
          </div>
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
                      <p className="text-[13px] text-gray-600 mt-1">
                        作業実施日: {c.work_dates && c.work_dates.length > 0 ? c.work_dates.join("・") : "-"}
                      </p>
                      <p className="text-[13px] text-gray-600 mt-1">
                        次回作業実施予定日: {c.next_work_date || "-"}
                      </p>
                      {c.note && (
                        <p className="text-[13px] text-gray-600 mt-1 line-clamp-2">
                          {c.note}
                        </p>
                      )}
                      {Array.isArray(c.photos_work) && c.photos_work.length > 0 && (
                        <div className="mt-2 grid grid-cols-4 gap-1">
                          {c.photos_work.slice(0, 8).map((url) => (
                            <a key={url} href={url} target="_blank" className="block">
                              <img
                                src={url}
                                alt="photo"
                                className="w-full h-14 object-cover rounded"
                                loading="lazy"
                              />
                            </a>
                          ))}
                          {c.photos_work.length > 8 && (
                            <div className="flex items-center justify-center h-14 rounded bg-gray-100 text-[12px] text-gray-600">
                              +{c.photos_work.length - 8}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        className="px-3 py-2 rounded-lg border border-gray-300 text-[14px]"
                        onClick={() => startEdit(c)}
                      >
                        編集
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-[14px]"
                        onClick={() => deleteCustomer(c.id)}
                      >
                        削除
                      </button>
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


