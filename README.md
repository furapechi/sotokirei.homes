## 顧客管理アプリ (sotokirei.homes)

モバイル最優先・シンプル&軽量なUIの顧客管理アプリ。Next.js(App Router) + Tailwind CSS + Supabase。

### ローカル開発

1) 依存関係のインストール

```bash
npm i
```

2) 環境変数の設定（プロジェクト直下に `.env.local` を作成）

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3) 開発サーバー起動

```bash
npm run dev
```

### Supabase テーブル

以下をSQLエディタで実行:

```sql
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  note text,
  created_at timestamp with time zone default now()
);

alter table customers enable row level security;
create policy "Public read" on customers for select using (true);
create policy "Public insert" on customers for insert with check (true);
```

### デザイン方針

- タップ領域は最低44px、フォームは12px以上の余白
- 情報階層は見出しと余白で整理
- 過度な彩色を避け、可読性優先

### GitHub へのプッシュ

```bash
echo "# sotokirei.homes" >> README.md
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/furapechi/sotokirei.homes.git
git push -u origin main
```
