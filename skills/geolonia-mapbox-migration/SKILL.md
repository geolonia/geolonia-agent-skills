---
name: geolonia-mapbox-migration
description: >
  Mapbox GL JS を使ったコードを Geolonia Maps（MapLibre GL JS ベース）へ移行するときに使用する。
  npm の mapbox-gl から @geolonia/maps-core への移行、script タグで読み込んだ Mapbox GL JS から
  Geolonia Maps の CDN 埋め込みへの移行、mapboxgl.Map / Marker / Popup / addSource / addLayer を
  使った既存実装の Geolonia Maps 化、mapbox:// スタイルや accessToken の置き換え、
  "Mapbox から移行したい" "Mapbox を Geolonia に置き換えたい" といったリクエストで呼び出す。
---

# Geolonia Mapbox 移行ガイド

## 概要

MapLibre GL JS は Mapbox GL JS v1.13（BSD ライセンス最後の版）から分岐したライブラリで、Geolonia Maps はその MapLibre GL JS を土台にしている。そのため `Map` / `Marker` / `Popup` / `addSource` / `addLayer` / イベント / 式（expressions）といった v1 時代からある API は、名前空間を置き換えるだけでほぼそのまま動く。

移行で手を入れるのは主に次の 3 つ。

- **Mapbox 固有のもの**: `accessToken`、`mapbox://` で始まるスタイルやソース、Mapbox Studio のスタイル、Mapbox の REST API（Geocoding / Directions など）とプラグイン
- **分岐後に Mapbox だけが足した API**: `setFog`、FreeCamera、Mapbox Standard スタイルとその設定 API（`setConfigProperty` など）、3D モデルレイヤーなど
- **Geolonia Maps 固有の差分**: `GeoloniaMap` の既定値（コントロール、ジェスチャ操作）、API キー、MapLibre v6 の worker 設定

**このスキルの記述は `@geolonia/maps-core` v0.8.0（`maplibre-gl` v6 系）と CDN の `embed/v6`（`@geolonia/embed` v6.0.1、MapLibre GL JS v6.16.0 を同梱）の時点のもの。** インストールした版がこれより新しい場合は、インストール済みパッケージの型定義（`node_modules/@geolonia/maps-core/dist/npm/index.d.ts` と `node_modules/maplibre-gl/dist/maplibre-gl.d.ts`）を正とする。

## 移行先の選び方

| 移行元のコード | 移行先 |
| --- | --- |
| npm の `mapbox-gl` を `import` している | `@geolonia/maps-core`（`GeoloniaMap` は `maplibregl.Map` を継承）。このスキルの本線 |
| `<script src="https://api.mapbox.com/mapbox-gl-js/...">` で読み込んでいる | CDN の `embed/v6`（`geolonia.Map`）。差分は [`references/api-differences.md`](references/api-differences.md) の「script タグで読み込んでいる場合」 |
| `react-map-gl` を使っている | `@geolonia/maps-react` があるが、`react-map-gl` と API 互換ではない（たとえば `<Map>` は `initialViewState` ではなく `center` / `zoom` を受け取り、`<Marker>` の座標は `longitude` / `latitude` ではなく `lng` / `lat`）。対応表はこのスキルの範囲外なので、パッケージの README を読んで書き換える。worker の設定（下の手順 4）はこちらでも必要 |

## いつ使うか（When to Use This Skill）

- Mapbox GL JS（`mapboxgl.*`）で書かれたコードを Geolonia Maps へ移行したい
- `mapbox://styles/...` や `mapboxgl.accessToken` をやめて Geolonia のスタイルや API キーに切り替えたい
- Mapbox のスタイルの上に重ねていた自前のレイヤーやデータを Geolonia Maps の上に移したい

次の場合は無理に適用しない:

- 新規実装（Mapbox からの移行ではない）→ [`geolonia-map`](../maps/SKILL.md) スキルを使う
- Google Maps JavaScript API からの移行 → [`geolonia-google-maps-migration`](../geolonia-google-maps-migration/SKILL.md) スキルを使う
- Mapbox を使い続けたまま Mapbox の機能を使いたい（移行ではない）

## 移行手順（npm の mapbox-gl から @geolonia/maps-core へ）

1. **棚卸し（最初にやる）**: 次の文字列でコードを検索し、置き換えが要るものを洗い出す。見つかったものは [`references/known-gaps.md`](references/known-gaps.md) で対応を確認しておく。
   - `mapbox://`、`accessToken`、`api.mapbox.com`
   - `setFog`、`FreeCameraOptions`、`setConfigProperty`、`addImport` / `"imports"`、`slot`、`type: 'model'`、`projection`
   - `@mapbox/mapbox-gl-geocoder`、`@mapbox/mapbox-gl-directions`、`@mapbox/mapbox-gl-draw` などのプラグイン
   - `mapboxgl-` で始まる CSS クラス名
2. **インストール**: `npm uninstall mapbox-gl` の後、`npm install @geolonia/maps-core maplibre-gl`。`maplibre-gl` は peer dependency で v6 系が必要。どちらも **ESM 専用**（`require()` では読めない）。
3. **import と CSS の置き換え**: `import mapboxgl from 'mapbox-gl'` を消し、`import { GeoloniaMap } from '@geolonia/maps-core'` と、`Popup` などのクラスは `import { Popup, NavigationControl } from 'maplibre-gl'` で読み込む。`maplibre-gl` v6 には default export が無い。CSS は `maplibre-gl/dist/maplibre-gl.css` と `@geolonia/maps-core/css` の 2 つを読み込む。
4. **worker の設定**: `maplibre-gl` v6 は worker を実際の URL から読み込むので、多くのバンドラでは最初の地図を作る前に `setWorkerUrl()` が必要。これを忘れると、エラーも出ずに地図がいつまでも表示されない。バンドラごとの書き方は [`references/api-differences.md`](references/api-differences.md)。
5. **地図の初期化**: `new mapboxgl.Map({...})` を `new GeoloniaMap({...})` に置き換え、`mapboxgl.accessToken = ...` の行を消す。Geolonia のスタイル（`'geolonia/basic-v2'` など）を使う場合は `apiKey` を渡す。Geolonia のスタイルもタイルも参照しない外部の style.json だけを使う場合は API キーは要らない（外部の style.json でも Geolonia のタイルを参照していればキーが要る）。また、`style` を省略すると既定の Geolonia のスタイルになり、API キーが無いと例外になる。キーを使わない場合は外部の style.json の URL を必ず指定する。API キーは [app.geolonia.com](https://app.geolonia.com/) のコンソールで発行する。
6. **既定値の違いを確認する**: `GeoloniaMap` は既定でズームのコントロール、Geolonia のロゴ、ローディング表示、スクロールするページでのジェスチャ操作（地図を動かすのに 2 本指や修飾キーを求める）が有効。ロゴ以外は `false` を渡せば消せる。Geolonia のロゴは v0.8.0 では `geoloniaControl: false` でも消えず、表示位置だけ変えられる（[`references/api-differences.md`](references/api-differences.md)）。
7. **スタイルの置き換え**: `mapbox://styles/...` は使えない（残すと例外は出ずに地図が表示されないだけになる）。`style` は文字列しか受け付けないので、スタイルをオブジェクトで渡していた場合は、URL にするか、有効なスタイルの URL で地図を作ってから `map.setStyle()` で渡す。`setStyle()` でスタイルが作り直されると、それまでに `addSource` / `addLayer` / `addImage` で足したものが消える（差分だけが当たった場合は残ることもある）ので、[`references/api-differences.md`](references/api-differences.md) の「スタイルを差し替えるとき」の手順（`setStyle()` の前に `style.load` を登録し、`diff: false` を渡し、有無を確かめてから足し直す）で復元する。Geolonia のスタイル（`geolonia/basic-v2` など）か、自前または外部の style.json に置き換える。Mapbox のベクトルタイル（Mapbox Streets）と Geolonia のタイル（OpenMapTiles 互換）はスキーマが違うので、ベースマップの `source-layer`（`road` や `poi_label` など）を参照している自前のレイヤーやフィルタは書き直す。自前の GeoJSON やタイルから作ったレイヤーはそのまま動く。ただし `icon-image` が移行前のスタイルのスプライトにある画像を指していたら、移行先のスプライトに同じ名前の画像があるかを確かめ、無ければ `map.addImage()` で足す。
8. **クラスと名前空間の置き換え**: 残りの `mapboxgl.X` を `maplibre-gl` からの import に置き換える。マーカーは `maplibre-gl` の `Marker` のままでもよく、Geolonia の既定の見た目にしたい場合は `GeoloniaMarker` を使う。CSS で `.mapboxgl-ctrl` などを指定していたら `.maplibregl-ctrl` に直す。
9. **戻り値とコールバックの違いを直す**: 名前は同じでも、MapLibre では書き方が変わったものがある（[`references/api-differences.md`](references/api-differences.md)）。
   - `map.on()` は地図ではなく `Subscription` を返すので、`map.on(...).on(...)` のようなチェーンは分ける。
   - GeoJSON ソースの `getClusterExpansionZoom()` / `getClusterChildren()` / `getClusterLeaves()` はコールバックを受け取らず Promise を返す。`await` か `then()` に書き換える。`map.loadImage()` は `GeoloniaMap` ならコールバック形式も受け付けるのでそのままでも動く（素の MapLibre の `Map` では Promise だけ）。
   - `preserveDrawingBuffer` / `antialias` / `failIfMajorPerformanceCaveat` は `canvasContextAttributes` の中に移す。
10. **分岐後の Mapbox 固有 API を書き換える**: `setFog` は `setSky`、`setFreeCameraOptions()` は `calculateCameraOptionsFromCameraLngLatAltRotation()` と `jumpTo` / `easeTo` / `flyTo` に置き換える（`getFreeCameraOptions()` に相当する API は無い）。Mapbox Standard スタイルの設定 API や 3D モデルレイヤーには対応するものが無い（[`references/known-gaps.md`](references/known-gaps.md)）。
11. **Mapbox のサービスとプラグインを置き換える**: 日本の住所のジオコーディングは [`geolonia-map`](../maps/SKILL.md) スキルの `geocoding.md` を使う。経路検索（Directions）は Geolonia Maps に無いので、別のサービスを組み合わせる（[`references/known-gaps.md`](references/known-gaps.md)）。
12. **ビルド・動作確認**: ブラウザで地図が表示され、自前のレイヤー、マーカー、ポップアップ、クリックイベントが動くことを確かめる。地図が真っ白なままでエラーも出ない場合は、まず手順 4 の worker の設定を疑う。

## 手を動かす前に知っておくべきこと

- 互換なのは v1 時代からある API。Mapbox GL JS v2 / v3 で入った API ほど、そのままでは動かない。「名前空間を置き換えれば終わり」と見積もる前に、手順 1 の棚卸しをする。
- Mapbox の名前で見つからない API を「MapLibre の版が古いせい」と考えて版を上げても解決しない。MapLibre 側の名前を調べる（`setFog` → `setSky` など）。
- npm の `@geolonia/maps-core` も CDN の `embed/v6` も、MapLibre GL JS v6 系の上で動く（`embed/v6` は内部で `@geolonia/maps-core` を使っている）。主な違いは読み込み方で、npm 版はバンドラと worker の設定が要り、CDN 版は `<script>` 1 行で worker も同梱されている（CDN 版は `class="geolonia"` の自動変換なども加わる。[`references/api-differences.md`](references/api-differences.md) の「script タグで読み込んでいる場合」）。
- `GeoloniaMap` は `maplibregl.Map` を継承しているので、`map.on('load', ...)` / `addSource` / `addLayer` / `queryRenderedFeatures` などはそのまま使える。Geolonia 用に書き換えようとしない。
- API キーを公開リポジトリやコミットに直書きしない。

## 既知のギャップ

詳細と代替手段は [`references/known-gaps.md`](references/known-gaps.md)。

- `mapbox://` のスタイル・ソース・スプライト・グリフ、Mapbox Studio のスタイルはそのままでは使えない
- `setFog`、FreeCamera、Mapbox Standard スタイルの設定 API（`setConfigProperty` / style imports / slots）、3D モデルレイヤーは MapLibre に同名の API が無い
- Mapbox の Geocoding（日本の住所以外）、Directions、Search などの REST API に相当するものは Geolonia Maps に無い

## リファレンス

- [`references/api-differences.md`](references/api-differences.md): import と CSS、バンドラごとの worker 設定、`GeoloniaMap` のオプションと既定値、script タグで読み込んでいる場合の差分
- [`references/known-gaps.md`](references/known-gaps.md): Mapbox 固有の機能と、その代わりに使うもの

## 関連スキル

- [`geolonia-map`](../maps/SKILL.md): 移行後の実装で Embed API / JavaScript API / ジオコーディングを使う際の一般的なガイド
- [`geolonia-google-maps-migration`](../geolonia-google-maps-migration/SKILL.md): Google Maps JavaScript API からの移行
