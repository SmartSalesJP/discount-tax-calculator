# 開発部 検証記録

検証日: 2026-10-19 (JST)。対象: `work/calculator-draft`。

## 実施・結果

- `node --test tests/calculator.test.mjs`: 34/34 PASS。計算不変条件の1,152構成を含む。
- `node --check app.mjs`, `node --check sw.js`: PASS。
- `node tests/browser-smoke.mjs`: Playwright + Microsoft Edge、ヘッドレス実ブラウザ、PASS。
- ブラウザ試験: `/discount-tax-calculator/` での相対パス配信、320/390/1280pxで横溢れなし、上限入力でも横溢れなし、可視ボタン高さ44px以上、税込/税抜切替、割引/内税切替、入力エラーによる結果消去、クリア、インストールUI。
- オフライン実測: 初回オンラインでService Worker準備完了 → リロードしてcontroller確認 → ブラウザcontextのネットワーク遮断 → 再読み込み成功 → 金額10,800/20%/税率8で8,640円 → 千円切り捨てONで8,000円・税593円。全アサーションPASS。
- ブラウザの `pageerror`: 0件。
- 独自アイコン: SVG、PNG 192×192・512×512・maskable 512×512・Apple 180×180生成済。
- 独立レビュー経由の修正: 補助文字/フッターを `#5f6c63` に濃くし、ブランドリンクの最低高さを44pxに修正。組合せ試験名を実数1,152へ修正。SWキャッシュのバージョン更新手順をREADMEへ記載。

## 配布

実行に必要: `.nojekyll`, `index.html`, `styles.css`, `app.mjs`, `calculator.mjs`, `manifest.webmanifest`, `sw.js`, `assets/`。

ソースリポジトリに含めてよい開発資料: `README.md`, `package.json`, `tests/`, `VERIFICATION.md`。静的配信時は除外可能。秘密情報、外部依存パッケージ、ビルド成果の重複は含まない。

## 未確認

- 実機iOS/Androidでのホーム画面追加・OSアイコン表示。
- 公開URLでの確認（公開完了後、同ブラウザ試験を `BASE_URL` 指定で再実行可能）。
- 独立レビュー最終判定は秘書が集約。

本記録は開発部の中間成果です。共有先・Obsidian・GitHubへの最終反映は行っていません。
