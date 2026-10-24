# Okimemo Cloudflare D1移行（検証用）
既存のSupabase版はそのままにし、`feat/cloudflare-d1-migration` で別実装を検証します。

## 必須の安全設定
1. CloudflareでD1 `okimemo` を作成して database_id を `wrangler.jsonc` に指定。
2. `ALLOWED_EMAIL` に自分のメールアドレスを指定。
3. Workerの **Access** 設定で、**本番・プレビューすべて**をCloudflare Accessで保護し、本人のメールアドレスだけを許可。未保護のまま公開しないこと。
4. CloudflareのWorkers設定で、アセットを含めてAccessで保護されることを検証。

## ローカル準備
```sh
cd cloudflare
npx wrangler d1 execute okimemo --local --file=./schema.sql
npx wrangler dev
```
Accessを介さないローカルAPIは 401 を返す設計です。クラウド認証付き環境で確認してください。

## デプロイ時
```sh
cd cloudflare
npx wrangler d1 execute okimemo --remote --file=./schema.sql
npx wrangler deploy
```
**注意** 事前に Access 制限を設定し、設定されるまでは公開URLでの利用を禁止してください。

## データ移行
旧Supabaseの `okimemo_notes` を全件CSV/JSONで安全にエクスポートし、D1の `notes` に移します。ユーザーIDはAccessで許可するメールアドレスに統一してください。既存UUID・分類・日時・完了・重要・期限を維持します。移行ツールと移行後の照合は次の段階で実施します。データ確認と端末間同期の検証が終わるまで旧環境を停止しないでください。

## 留意点
リアルタイム更新は15秒ごとのポーリングに置き換え。カレンダー取込と画面の折りたたみ状態は現行どおり端末内保存で同期対象ではありません。
