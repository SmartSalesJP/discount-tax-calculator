# ぴたっと計算

割引後の支払額と内税を求める、日本語の静的PWAです。HTML/CSS/JavaScriptのみ。実行時の外部ライブラリ、外部フォント、分析通信、ビルドはありません。

## 起動・公開

このディレクトリ全体を静的Webサーバーで配信します。GitHub Pagesではこの内容を公開ルートに置き、HTTPSで公開してください。想定URLは `https://smartsalesjp.github.io/discount-tax-calculator/`。すべての参照、manifestの `start_url` / `scope`、Service Worker登録を相対パスにしています。`file://` での直開きはES ModulesとService Workerの制約から非対応です。

初回のオンライン読み込みで必要ファイルのキャッシュが完了した後、オフラインで再表示・計算できます。キャッシュ完了前は画面下部に「オフライン準備中」と表示します。ホーム画面追加ボタンは対応ブラウザの追加画面を開き、それ以外では手順を表示します。

## 入力と操作

- 金額: 0〜999,999,999円の整数。カンマや通貨記号は入力しません。
- 割引率: 0〜100%、小数点以下2桁まで。10/20/30/50%のボタン付き。
- 全角数字は半角へ正規化します。空欄、不正値、負数はエラーを表示し、古い計算結果を消します。
- 税込/税抜の入力切替、税率8/10%、割引計算/内税計算モード。
- 内税モードは常に税込金額を入力し、割引率を適用しません。
- 「入力をクリア」は金額を空欄、割引率を0、千円未満切り捨てをOFFにします。モード・税率・税区分は維持します。
- 値は保存しません。再読み込み時は例の10,000円・20%・税込・税率10%に戻ります。

## 計算の定義

`P`: 入力金額、`d`: 割引率/100、`t`: 税率/100、`R(x)`: 1円未満を四捨五入（0.5円を切り上げ）。非負整数の分子と分母を `BigInt` で計算するため、二進浮動小数点による0.5円境界の誤差はありません。

| モード | 元の税込額 O | 割引後税込額 G | 税抜額 N |
| --- | --- | --- | --- |
| 税込入力・割引 | P | R(P × (1−d)) | R(G ÷ (1+t)) |
| 税抜入力・割引 | R(P × (1+t)) | R(B × (1+t)), B=R(P × (1−d)) | B |
| 内税のみ | P | P | R(G ÷ (1+t)) |

消費税額 = `G−N`。節約額 = `O−G`。節約額は割引モードで表示します。

### 1,000円未満切り捨て

任意設定です。通常の計算で求めた最終税込額を `G'=floor(G/1000)×1000` に変え、税抜額を `R(G'/(1+t))`、税額を `G'−N` として再計算します。税抜入力も同様です。節約額には追加の切り捨て額が含まれます。1,000円未満なら0円です。ON時には画面上に適用前後の税込額と切り捨て額を表示します。

例: 税込10,800円、20%OFF、税率8% → 税込8,640円、税抜8,000円、税640円。切り捨てON → 税込8,000円、税抜7,407円、税593円。

計算上の端数処理であり、店舗や請求書ごとの処理方式により結果が異なる場合があります。

## ファイル

- `index.html`, `styles.css`: レスポンシブUI。システムフォント、320px幅対応、44px以上の操作領域、キーボードフォーカス、計算結果のライブ通知。
- `app.mjs`: 入力/UI状態、ホーム画面追加、接続状況。
- `calculator.mjs`: DOMから独立した計算と入力検証。
- `manifest.webmanifest`, `sw.js`: ホーム画面用メタデータとオフラインキャッシュ。
- `assets/icon.svg`: 独自デザインのレシートとパーセント記号。
- `assets/icon-192.png`, `icon-512.png`: 通常アイコン。
- `assets/icon-maskable-512.png`: 全面背景と中央セーフゾーンを持つmaskableアイコン。
- `assets/apple-touch-icon.png`: Apple用180×180アイコン。
- `tests/calculator.test.mjs`: Node標準テストランナーによる34件、組合せ検証1,152通りを含む。
- `tests/browser-smoke.mjs`: Playwrightを利用できる開発環境でのブラウザ検証。

## 検証

Node.jsを使い `npm test` または `node --test tests/calculator.test.mjs` を実行します。依存パッケージのインストールは不要です。初期値、8/10%、税込/税抜、内税のみ、0/100%割引、小数割引、千円切り捨て、0/上限金額、空欄・負数・不正文字、税抜＋税額＝税込、節約額の整合性を確認します。

ブラウザ検証は、Playwrightが利用可能な環境で `node tests/browser-smoke.mjs`。別の場所にある場合は `BROWSER_MODULE_DIR` をその `node_modules` 絶対パスに指定します。ローカルサーバーは試験中だけ起動・終了し、実際のサブパス配信、320px/390px/1280px、操作、Service Worker準備後のネット遮断・再読み込み・計算を検証します。

既存Edgeを使う場合は `BROWSER_CHANNEL=msedge`、公開先を検証する場合は `BASE_URL=https://smartsalesjp.github.io/discount-tax-calculator/` を環境変数に設定します。PNG再生成は任意の開発補助 `tests/generate-icons.mjs` で実行でき、開発環境の `sharp` を使用します。通常の利用・公開時にこれらの依存関係は不要です。

更新時は `sw.js` のキャッシュバージョン（`v1`）を変更してください。旧版を開いている全タブを閉じた後に新版Service Workerが有効になります。同一ホストの別アプリのキャッシュは削除しません。

## 一次資料

- MDN: [PWAをインストール可能にする](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- MDN: [アプリのアイコン](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons)
- MDN: [manifest start_url](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url)
- MDN: [manifest scope](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope)

実機のホーム画面追加およびiOS/Android各OSでの表示確認は別途必要です。一般のブラウザによるキャッシュ消去や端末のストレージ管理でオフラインデータが削除された場合は、再度オンラインで開いてください。
