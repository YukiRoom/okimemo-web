# Okimemo D1 移行 — 非公開検証版

既存の `main` およびSupabase版には手を加えません。公開前に以下の設定を完了してください。

## 重要な変更
- Cloudflare Accessが付けるJWTを `jose` で署名・発行元・AUDまで検証します。静的ファイルも含めて認証必須です（誤公開を防ぐため、環境変数未設定時は503）。
- `ALLOWED_EMAIL` は本人専用メールアドレスです。Cloudflare Access側でもAll trafficと本人限定ポリシーにしてください。
- まだD1のIDは未設定です。部署名・メール等の値をコード公開リポジトリに記載せず、必要ならWorkers環境変数を利用してください。

## Cloudflare 設定
1. 作成済みD1 `okimemo` の Settings からdatabase IDをコピーし、`wrangler.jsonc` の `database_id` を設定。
2. `ALLOWED_EMAIL`:本人のメール、`TEAM_DOMAIN`: https://TEAM.cloudflareaccess.com 、`POLICY_AUD`: Access application Audienceタグを設定。
3. Cloudflare Accessのscopeは **All traffic**、本人だけを許可。
4. Workers Buildsのroot Pathは `/cloudflare`、worker project nameは `okimemo-web`。**本番ブランチを `feat/cloudflare-d1-migration` に設定できるまでDeployしない**。ブランチ制御は作成後 Settings > Build > Branch control で変更可能。
5. GitHub連携のbuildコマンドは `npm install`（ロックファイル作成・固定は本番前に実施）、deployは `npx wrangler deploy`。tokenやconfigを適切に設定。
6. DBスキーマはCloudflareコンソールで適用済みのため、再適用は不要（`schema.sql` は再現用）。
7. 別端末同期、認証、APIエラー、編集・削除の確認完了まで旧版を維持。

## データ移行
Supabase `okimemo_notes` の全行を安全な場所へエクスポートした上で、ID/本文/分類/期限/完了/重要/日時を保持してD1へ移行すること。現時点では移行していません。リポジトリには実データをコミットしないでください。

### 承認後に行う安全な移行・照合
1. Supabaseの読み取り専用スナップショットを取得し、暗号化された作業場所に保存する。Supabase側では削除・更新を行わない。
2. 件数、ID重複、user_id、必須列、分類値、日時形式を検査する。本人の行だけを対象にし、移行対象件数とID一覧のハッシュを記録する。
3. D1へ一時テーブルまたは再実行可能なバッチで投入する。投入後に件数、IDハッシュ、本文・分類・期限・フラグ・日時の列別ハッシュを照合する。
4. Cloudflare Accessを通したステージングURLで、PC・スマホから取得・編集・削除・認証拒否・復元をテストする。
5. 照合結果とバックアップを保管し、明示的な承認後に本番切り替えする。Supabase停止は別途承認が必要。

## 現時点の機能上の差異
現在の実装は15秒ポーリングで同期。カレンダー取込・折りたたみ状態は現行どおりローカル保存で、端末間同期されません。Cloudflare上での動作試験はまだです。
