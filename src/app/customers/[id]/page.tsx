import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { cookies } from "next/headers";

export const revalidate = 0;

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase
    .from("customers")
    .select("id,name,phone,email,contract_amount,work_content,work_dates,next_work_date,photos_work,note,created_at")
    .eq("id", id)
    .single();

  if (!data) return (
    <div className="p-6">
      <p>データが見つかりません。</p>
      <Link href="/customers" className="text-blue-600">一覧へ戻る</Link>
    </div>
  );

  return (
    <div className="min-h-dvh bg-white text-gray-900 p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold">顧客情報</h1>
        <Link href="/customers" className="text-sm text-blue-600">一覧へ戻る</Link>
      </header>

      <section className="rounded-2xl border p-4 space-y-2">
        <h2 className="text-[16px] font-medium">基本情報</h2>
        <p className="text-[16px] font-semibold">{data.name || "(未設定)"}</p>
        <p className="text-[14px] text-gray-600">{data.phone || "-"} / {data.email || "-"}</p>
        {typeof data.contract_amount === "number" && (
          <p className="text-[14px]">金額: ¥{data.contract_amount.toLocaleString()}</p>
        )}
        {data.work_content && <p className="text-[14px]">作業内容: {data.work_content}</p>}
        <p className="text-[14px]">作業実施日: {(data.work_dates || []).join("・") || "-"}</p>
        <p className="text-[14px]">次回作業実施予定日: {data.next_work_date || "-"}</p>
        {data.note && <p className="text-[14px]">メモ: {data.note}</p>}
      </section>

      {Array.isArray(data.photos_work) && data.photos_work.length > 0 && (
        <section className="rounded-2xl border p-4 space-y-2">
          <h2 className="text-[16px] font-medium">作業写真</h2>
          <div className="grid grid-cols-3 gap-2">
            {data.photos_work.map((url: string) => (
              <a key={url} href={url} target="_blank" className="block">
                <img src={url} alt="photo" className="w-full h-24 object-cover rounded" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


