import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">sotokirei.homes</h1>
      <div className="flex gap-3">
        <Link href="/customers" className="px-4 py-2 rounded-lg border">顧客一覧</Link>
        <Link href="/calendar" className="px-4 py-2 rounded-lg border">カレンダー</Link>
      </div>
    </main>
  );
}
