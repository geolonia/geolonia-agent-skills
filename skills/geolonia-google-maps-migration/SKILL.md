---
name: geolonia-google-maps-migration
description: >
  Google Maps JavaScript API を使ったコードを @geolonia/maps-suite（Google Maps 互換 API を
  持つ MapLibre GL JS ベースのライブラリ）へ移行するときに使用する。google.maps.Map /
  Marker / InfoWindow / MarkerClusterer / Polyline / Polygon / Circle からの移行、既存の
  Google Maps 実装の Geolonia Maps 化、"Google Maps から移行したい" "geolonia に移行"
  といったリクエストで呼び出す。
---

# Geolonia Google Maps 移行ガイド

## 概要

`@geolonia/maps-suite` は Google Maps JavaScript API と互換性のあるクラス（`Map`,
`Marker`, `InfoWindow`, `MarkerClusterer`, `AdvancedMarkerElement`, `Polyline`, `Polygon`,
`Rectangle`, `Circle`, `LatLng`, `LatLngBounds`, `Point`, `Size` など）を提供する、
MapLibre GL JS ベースのライブラリ。既存の Google Maps 実装を「限りなくコードの変更なしで」
Geolonia Maps に移行することを目的としている。

**対象バージョンは v1.1.0。** v1.1.0 で図形クラス（Polyline/Polygon/Rectangle/Circle）、
ベクター記号アイコン（`SymbolPath`）、カメラ操作 API（`moveCamera`/`setHeading`/`setTilt`）
が追加され、`panTo()` + `setZoom()` の互換性バグも解消された。v1.0.1 向けに書かれた
回避策コード（`_getImpl()` で線を引く、SVG data URI で丸マーカーを作る）は新規コードには
不要になっている。

一方で Places/Directions/Geocoder といったサービス系 API、図形のクリックイベント、
`draggable`/`editable`/`zIndex` などは未実装のまま。**移行を始める前に、対象コードが何を
使っているか棚卸しし、このスキルの「既知のギャップ」を必ず確認すること。**

## いつ使うか（When to Use This Skill）

- Google Maps JavaScript API（`google.maps.*`）で書かれたコードを Geolonia Maps へ移行したい
- `@googlemaps/js-api-loader` や `@googlemaps/markerclusterer` を使ったコードを置き換えたい
- 既存の地図アプリを Google Maps から Geolonia Maps（MapLibre GL JS ベース）へ切り替えたい

次の場合は無理に適用しない:

- 新規実装（Google Maps からの移行ではない）→ [`geolonia-map`](../maps/SKILL.md) スキルを使う
- Mapbox GL JS からの移行 → 別スキル（mapbox-maplibre-migration 等）を参照する

## 移行手順

1. **棚卸し（最初にやる）**: 対象コードが使っている Google Maps API を洗い出す。
   `Geocoder`/`DirectionsService`/`Places`、図形のクリックイベント、`draggable`/`editable`、
   `gestureHandling`/`mapTypeId` 等の `MapOptions` は maps-suite に **存在しない**ため、
   見つかった場合は先に回避策を確認しておく
   （[`references/known-gaps.md`](references/known-gaps.md)）。
2. **インストール**: `npm install @geolonia/maps-suite maplibre-gl`
   （`maplibre-gl` は peer dependency）。v1.1.0 を使うこと。
3. **API キーの取得**: [app.geolonia.com](https://app.geolonia.com/) のコンソールで発行する
   （組織内に共有のデモキーは無い）。外部の style.json を使う場合は不要。
4. **ローダーの置き換え**: `@googlemaps/js-api-loader` を
   `import { geolonia } from '@geolonia/maps-suite'` に置き換える
   （[`references/api-differences.md`](references/api-differences.md)）。
5. **地図の初期化**: `new geolonia.maps.Map(el, { center, zoom, style, apiKey })`。
   `gestureHandling`/`mapTypeId` 等は削除し、既定コントロールを消したい場合は
   `disableDefaultUI: true` にまとめる。**`center`/`zoom` を省略すると `[0, 0]`/`z0` の
   全球表示**、**3D 建物は既定 ON**（切るなら `threeDimensional: false`）という v1.1.0 の
   既定値に注意（[`references/api-differences.md`](references/api-differences.md)）。
6. **マーカー・ポップアップ・クラスタリング**: `geolonia.maps.Marker`/`MarkerClusterer`
   はほぼそのまま移植できる。`InfoWindow.open()` の引数の形が異なる点に注意
   （[`references/api-differences.md`](references/api-differences.md)）。
7. **マーカーアイコン**: `icon` は画像 URL（`{ url }`）とベクター記号
   （`{ path: SymbolPath.CIRCLE, scale, fillColor, ... }`）の両方に対応。Google Maps の
   記述をそのまま移せる（[`references/marker-icons.md`](references/marker-icons.md)）。
8. **図形（Polyline/Polygon/Rectangle/Circle）**: クラス名を差し替えるだけで移植できる。
   地図の読み込み完了を待つ必要も無い。ただしクリックイベントが必要な場合だけは
   `map._getImpl()` で自前レイヤーを描く（[`references/shapes.md`](references/shapes.md)）。
9. **カメラ操作**: `panTo()` の直後の `setZoom()` は v1.1.0 で正しく動く（同一の同期処理内の
   変更は 1 回のカメラ操作にまとめられる）。`await` を挟むとまとまらないので、その場合は
   `moveCamera({ center, zoom })` を使う（[`references/known-gaps.md`](references/known-gaps.md)）。
10. **ビルド・動作確認**: `npm run build`/`npm run dev` の後、ブラウザで実際に地図・マーカー・
    ポップアップ・クラスタリング・図形の動作を確認する。プレースホルダー API キーでも
    ベースタイルは表示される（フォントグリフの取得のみ 403 になるが無害）ため、実キーが
    無くても UI ロジックの確認は進められる。ただし本番投入前には実キーでの最終確認が必要。

## 手を動かす前に知っておくべきこと（振り返り）

実際の移行作業（`_poc/google-maps-projects/vanilla` 配下 4 プロジェクト、v1.0.1 時点）で
得られた教訓。v1.1.0 で状況が変わったものはその旨を併記する。

- `@geolonia/maps-suite` は「Google Maps 互換」であって「完全再現」ではない。棚卸し
  （手順 1）を省略すると実装途中で手戻りが発生する。カバー範囲は版ごとに広がっているので、
  **古いメモではなく対象バージョンのソース・型定義を見る**こと。
- `map._getImpl()`/`map._whenReady()` は「内部用」と書かれているが実行時には普通に呼び出せる。
  v1.1.0 では図形もアイコンも公式 API で書けるようになったため、エスケープハッチが必要な
  場面は「図形のクリック判定」「大量フィーチャの一括描画」「MapLibre 固有の表現」に絞られた。
  まず公式 API で書き、足りないときだけ `_getImpl()` に降りる。
- ライブラリ由来のバグか疑わしい挙動に遭遇したら、アプリのコードから切り離した最小の
  再現用 HTML（`dist/maps-suite.js` の IIFE バンドル + 簡単な `http-server`）を先に書いて
  確認する方が早い。
- 組織内に共有のデモ用 Geolonia API キーは無い。実キーが必要な場面とプレースホルダーで
  十分な場面を区別すると、キー発行待ちで作業を止めずに済む。

## 既知のギャップ（v1.1.0 時点）

v1.0.1 時点で回避策が必須だった 3 件（Polyline / ベクター記号アイコン / panTo + setZoom）は
**すべて v1.1.0 で解消済み**。残っているのは以下。詳細と回避策は
[`references/known-gaps.md`](references/known-gaps.md)。

- 図形クラス（Polyline/Polygon/Rectangle/Circle）が `click` イベントを発火しない
- 図形・マーカーのオプションが最小セット（`editable`/`draggable`/`zIndex`/`label` 等が無い）
- `MapOptions` に `gestureHandling`/`mapTypeId`/`minZoom`/`maxZoom` などが無い
- Geocoder / Directions / Places など サービス系 API が未実装
  （`importLibrary("places")` は警告を出して空オブジェクトを返す）

## リファレンス

- [`references/known-gaps.md`](references/known-gaps.md) — v1.1.0 で解消されたギャップの一覧と、残っているギャップ・回避策
- [`references/api-differences.md`](references/api-differences.md) — Google Maps と maps-suite で細部が異なる API（`MapOptions` の対応表と既定値、カメラ操作、`InfoWindow.open()` の引数、`importLibrary()` のカバー範囲など）
- [`references/marker-icons.md`](references/marker-icons.md) — マーカーアイコン（`SymbolPath` によるベクター記号、画像 URL、data URI の使い分け）
- [`references/shapes.md`](references/shapes.md) — 図形クラスの移行、パスの動的更新、クリックイベントが必要な場合の実装例

## 関連スキル

- [`geolonia-map`](../maps/SKILL.md) — 移行後の実装で Embed API / JavaScript API を使う際の一般的なガイド（新規実装向け）
