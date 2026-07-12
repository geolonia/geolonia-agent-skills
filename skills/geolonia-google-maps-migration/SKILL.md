---
name: geolonia-google-maps-migration
description: >
  Google Maps JavaScript API を使ったコードを @geolonia/maps-suite（Google Maps 互換 API を
  持つ MapLibre GL JS ベースのライブラリ）へ移行するときに使用する。google.maps.Map /
  Marker / InfoWindow / MarkerClusterer / Polyline からの移行、既存の Google Maps 実装の
  Geolonia Maps 化、"Google Maps から移行したい" "geolonia に移行" といったリクエストで
  呼び出す。
---

# Geolonia Google Maps 移行ガイド

## 概要

`@geolonia/maps-suite` は Google Maps JavaScript API と互換性のあるクラス（`Map`,
`Marker`, `InfoWindow`, `MarkerClusterer`, `AdvancedMarkerElement`, `LatLng`,
`LatLngBounds` など）を提供する、MapLibre GL JS ベースのライブラリ。既存の Google Maps
実装を「限りなくコードの変更なしで」Geolonia Maps に移行することを目的としている。

ただし現時点（v1.0.1）では Google Maps API 全体をカバーしているわけではない。
`Polyline`/`Polygon`/`Circle` やベクター記号アイコン（`SymbolPath`）、Places/Directions
系のサービスは未実装。**移行を始める前に、対象コードが何を使っているか棚卸しし、
このスキルの「既知のギャップ」を必ず確認すること。**

## いつ使うか（When to Use This Skill）

- Google Maps JavaScript API（`google.maps.*`）で書かれたコードを Geolonia Maps へ移行したい
- `@googlemaps/js-api-loader` や `@googlemaps/markerclusterer` を使ったコードを置き換えたい
- 既存の地図アプリを Google Maps から Geolonia Maps（MapLibre GL JS ベース）へ切り替えたい

次の場合は無理に適用しない:

- 新規実装（Google Maps からの移行ではない）→ [`geolonia-map`](../maps/SKILL.md) スキルを使う
- Mapbox GL JS からの移行 → 別スキル（mapbox-maplibre-migration 等）を参照する

## 移行手順

### 1. 棚卸し（最初にやる）

対象コードが使っている Google Maps API を洗い出す。特に以下は maps-suite に**存在しない**ため、
見つかった場合は事前に回避策を検討しておく（詳細: [`references/known-gaps.md`](references/known-gaps.md)）。

- `google.maps.Polyline` / `Polygon` / `Circle`
- `icon: { path: google.maps.SymbolPath.CIRCLE, ... }` のようなベクター記号アイコン
- `Geocoder` / `DirectionsService` / `Places` などのサービス系 API
- `gestureHandling` / `fullscreenControl` / `streetViewControl` / `mapTypeId` などの `MapOptions`

### 2. インストール

```bash
npm install @geolonia/maps-suite maplibre-gl
```

`maplibre-gl` は peer dependency なので必ず一緒にインストールする。

### 3. API キーの取得

Geolonia API キーは [app.geolonia.com](https://app.geolonia.com/) のコンソールで発行する
（組織内に共有のデモキーは存在しない）。環境変数名は `VITE_GOOGLE_MAPS_API_KEY` のような
既存の命名から `VITE_GEOLONIA_API_KEY` 等へリネームするとよい。

外部の style.json を指定する場合は API キー不要（`geolonia/gsi` 等の組み込みスタイルを使う
場合は API キーが必要）。

### 4. ローダーの置き換え

```javascript
// Before
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
setOptions({ key: API_KEY, v: 'weekly' });
const { Map } = await importLibrary('maps');

// After
import { geolonia } from '@geolonia/maps-suite';
// geolonia.maps.Map / Marker / InfoWindow / MarkerClusterer を直接参照できる
```

`geolonia.maps.importLibrary("maps" | "marker" | "core")` という非同期ローダーも存在するが、
`InfoWindow` はどのライブラリ名でも返ってこない（`geolonia.maps.InfoWindow` を直接参照する
必要がある）。混乱を避けるため、このスキルでは `geolonia.maps.*` を直接参照する方法を推奨する。

### 5. 地図の初期化

```javascript
// Before
const map = new google.maps.Map(el, { center: { lat, lng }, zoom });

// After
const map = new geolonia.maps.Map(el, {
  center: { lat, lng },
  zoom,
  style: 'geolonia/gsi', // または 'geolonia/basic-v2' など
  apiKey: API_KEY,
});
```

`gestureHandling` / `fullscreenControl` / `streetViewControl` / `mapTypeId` は `MapOptions`
に存在しないので削除する。

### 6. マーカー・ポップアップ・クラスタリング

`geolonia.maps.Marker` / `MarkerClusterer` はほぼそのまま移植できる。`InfoWindow` は
`.open(map, anchor)`（位置引数）であって Google の `.open({ map, anchor })`（オプション
オブジェクト）ではない点に注意。詳細は [`references/api-differences.md`](references/api-differences.md)。

### 7. ベクター記号アイコン（SymbolPath）

`icon` は `{ url: string }`（画像 URL）のみ対応。色分けした円マーカーなどは実行時に SVG を
data URI として生成して代替する。実装例は
[`references/marker-icons.md`](references/marker-icons.md)。

### 8. Polyline / 線・面データ

`Polyline`/`Polygon` 相当のクラスは存在しない。`map._getImpl()`（内部の MapLibre GL JS
インスタンス）を取得し、`addSource`/`addLayer` で GeoJSON の `line`/`fill` レイヤーとして
描画する。実装例は [`references/polyline-workaround.md`](references/polyline-workaround.md)。

### 9. パン＋ズームの組み合わせに注意

`map.panTo(latLng)` の直後に `map.setZoom(zoom)` を呼ぶと、**パン先ではなく元の位置の
ままズームされる**（詳細は [`references/known-gaps.md`](references/known-gaps.md) の
「panTo() が setZoom() にキャンセルされる」を参照）。1 回の
`map._getImpl().easeTo({ center: [lng, lat], zoom })` にまとめて回避する。

### 10. ビルド・動作確認

```bash
npm run build   # エラー・警告なしで通ることを確認
npm run dev
```

ブラウザで実際に地図が表示され、マーカー・ポップアップ・クラスタリングが動作するか確認する。
プレースホルダー/無効な API キーでも `geolonia/gsi` 等のベースタイルは表示される
（フォントグリフの取得のみ 403 になるが無害）ため、実キーが手元になくても UI ロジックの
動作確認は可能。ただし本番投入前には実キーでの最終確認が必要。

## 手を動かす前に知っておくべきこと（振り返り）

実際の移行作業（`_poc/google-maps-projects/vanilla` 配下 4 プロジェクト）で得られた教訓。
最初から知っていれば手戻りが減った点をまとめる。

- **`@geolonia/maps-suite` は「Google Maps 互換」であって「Google Maps 完全再現」ではない。**
  `Polyline`/`Polygon`/`Circle`/ベクター記号アイコンが無いことを移行の**最初**に確認しないと、
  実装を半分終えたところで手戻りが発生する。棚卸し（手順 1）を必ず最初にやる。
- **`map._getImpl()` / `map._whenReady()` は「内部用」と書かれているが、実行時には普通に
  呼び出せる**（TypeScript の `private` はコンパイル後には効力を持たない）。maps-suite が
  カバーしていない機能は、最初からこの内部インスタンスへのエスケープハッチを使う前提で
  設計した方が早い。「公式 API を探す→無くて詰まる→ `_getImpl()` に辿り着く」という遠回りを
  しなくて済む。
- **`panTo()` + `setZoom()` の組み合わせは、Google Maps では問題なく動くが maps-suite では
  壊れる。** この不具合は表面上「パンしたのにマーカーが画面外に消えた」としか見えず、
  原因究明に時間がかかった（実際に MapLibre の `jumpTo()` が進行中の `easeTo()` を
  キャンセルすることが原因だと突き止めるまで、単体の再現用 HTML を書いて切り分けが必要
  だった）。**Google Maps のコードに `panTo` の直後の `setZoom` が出てきたら、最初から
  1 回の `easeTo({ center, zoom })` に書き換える前提で進める。**
- **組織内に共有のデモ用 Geolonia API キーは存在しない。** 実キーが必要な場面
  （タイル・グリフの完全な表示確認）と、プレースホルダーキーで十分な場面（UI ロジックの
  動作確認）を区別しておくと、キー発行待ちで作業を止めずに済む。
- **ライブラリ由来のバグかどうか疑わしい挙動に遭遇したら、アプリのコードから切り離した
  最小の再現用 HTML（`dist/maps-suite.js` の IIFE バンドル + 簡単な `http-server`）を先に
  書いて確認する。** アプリ側のコードを疑って延々とデバッグするより早く原因を特定できる。

## 既知のギャップ（未対処・upstream で追跡中）

以下は `@geolonia/maps-suite` 側で対応されるべきギャップとして
`tmp/geolonia-maps/sdk/issues/maps-suite/` に記録済み。対処されるまでは
[`references/known-gaps.md`](references/known-gaps.md) の回避策を使うこと。

- `missing-polyline.md` — Polyline 相当のクラスが存在しない
- `missing-symbol-path-circle.md` — Marker アイコンがベクター記号（SymbolPath.CIRCLE 等）に対応していない
- `panto-cancelled-by-setzoom.md` — panTo() 直後の setZoom() がパンをキャンセルしてしまう（互換性バグ、重要度高）

## リファレンス

- [`references/known-gaps.md`](references/known-gaps.md) — maps-suite に無い機能と回避策の一覧（上記 3 件の詳細）
- [`references/api-differences.md`](references/api-differences.md) — Google Maps と maps-suite で細部が異なる API（InfoWindow.open() の引数、importLibrary() のカバー範囲、MapOptions の非対応フィールドなど）
- [`references/marker-icons.md`](references/marker-icons.md) — ベクター記号アイコン（SymbolPath.CIRCLE 等）を SVG data URI で代替する実装例
- [`references/polyline-workaround.md`](references/polyline-workaround.md) — Polyline/Polygon を MapLibre の GeoJSON line/fill レイヤーで代替する実装例

## 関連スキル

- [`geolonia-map`](../maps/SKILL.md) — 移行後の実装で Embed API / JavaScript API を使う際の一般的なガイド（新規実装向け）
