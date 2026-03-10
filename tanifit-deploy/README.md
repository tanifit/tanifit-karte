# TANIFIT カルテ作成ツール

## デプロイ手順（Vercel）

### 1. GitHubにアップロード
1. [github.com](https://github.com) でアカウント作成（無料）
2. 「New repository」→ リポジトリ名: `tanifit-karte` → Create
3. 「uploading an existing file」をクリック
4. このフォルダの中身を全部ドラッグ＆ドロップ → Commit

### 2. Vercelにデプロイ
1. [vercel.com](https://vercel.com) でアカウント作成（GitHubでログイン）
2. 「Add New Project」→ GitHubのリポジトリを選択
3. 設定はそのままで「Deploy」
4. 完成！ `https://tanifit-karte.vercel.app` のようなURLが発行される

### 3. アプリの初期設定
1. URLにアクセス
2. 「設定」タブ → APIキー欄に Anthropic APIキーを入力
   - [console.anthropic.com](https://console.anthropic.com) で取得
3. 会員リスト・種目リストをインポート

## ローカルで動かす場合
```bash
npm install
npm run dev
```
