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

**このスキルの記述は `@geolonia/maps-suite` v1.2.2 時点のもの。**

**常に最新版を使うこと。** 互換の範囲はリリースごとに広がるため、古い版を指定すると、
いまは公式 API がある機能に対して不要な回避策を書くことになる。バージョンを固定する
理由が無いかぎり、インストールでは版を指定しない（`npm install @geolonia/maps-suite`）。

インストールした版がこのスキルの記述より新しい場合は、**このスキルではなくインストール
済みパッケージの型定義（`node_modules/@geolonia/maps-suite/dist/npm/index.d.ts`）を正とする。**
「無い」と書かれている機能が実際には追加されていることがある。回避策を書く前に、まず
その名前で型定義を検索する。

v1.2.2 時点で使える主なものは次のとおり。

- 図形クラス（`Polyline` / `Polygon` / `Rectangle` / `Circle`）
- ベクター記号アイコン（`SymbolPath`）
- カメラ操作（`moveCamera` / `setHeading` / `setTilt`）。`panTo()` + `setZoom()` も正しく動く
- GeoJSON レイヤー（`map.data`。`google.maps.Data` に相当）
- 土台へアクセスする公開 API（`map.getGeoloniaMap()` / `map.whenReady()` /
  `marker.getMapLibreMarker()`）

一方で Places/Directions/Geocoder といったサービス系 API、図形のクリックイベント、
`draggable`/`editable`/`zIndex` などは未実装。**移行を始める前に、対象コードが何を
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
   （`maplibre-gl` は peer dependency）。**版は指定せず最新を入れる。**
   入った版は `npm ls @geolonia/maps-suite` で確認しておく。
3. **API キーの取得**: [app.geolonia.com](https://app.geolonia.com/) のコンソールで発行する
   （組織内に共有のデモキーは無い）。外部の style.json を使う場合は不要。
4. **ローダーの置き換え**: `@googlemaps/js-api-loader` を
   `import { geolonia } from '@geolonia/maps-suite'` に置き換える
   （[`references/api-differences.md`](references/api-differences.md)）。
5. **地図の初期化**: `new geolonia.maps.Map(el, { center, zoom, style, apiKey })`。
   `gestureHandling`/`mapTypeId` 等は削除し、既定コントロールを消したい場合は
   `disableDefaultUI: true` にまとめる。**`center`/`zoom` を省略すると `[0, 0]`/`z0` の
   全球表示**、**3D 建物は既定 ON**（切るなら `threeDimensional: false`）という既定値に
   注意（[`references/api-differences.md`](references/api-differences.md)）。
6. **マーカー・ポップアップ・クラスタリング**: `geolonia.maps.Marker`/`MarkerClusterer`
   はほぼそのまま移植できる。`InfoWindow.open()` の引数の形が異なる点に注意
   （[`references/api-differences.md`](references/api-differences.md)）。
7. **マーカーアイコン**: `icon` は画像 URL（`{ url }`）とベクター記号
   （`{ path: SymbolPath.CIRCLE, scale, fillColor, ... }`）の両方に対応。Google Maps の
   記述をそのまま移せる（[`references/marker-icons.md`](references/marker-icons.md)）。
8. **図形（Polyline/Polygon/Rectangle/Circle）**: クラス名を差し替えるだけで移植できる。
   地図の読み込み完了を待つ必要も無い。ただしクリックイベントが必要な場合だけは
   `map.getGeoloniaMap()` で自前レイヤーを描く（[`references/shapes.md`](references/shapes.md)）。
9. **GeoJSON**: `google.maps.Data` を使っているコードは `map.data` に移せる。
   `map.data.addGeoJson(featureCollection)` で追加し、`map.data.setStyle({ ... })` で
   見た目を指定する。スタイルは関数も渡せるので、フィーチャごとの出し分けもできる。
10. **カメラ操作**: `panTo()` の直後の `setZoom()` は正しく動く（同一の同期処理内の
    変更は 1 回のカメラ操作にまとめられる）。`await` を挟むとまとまらないので、その場合は
    `moveCamera({ center, zoom })` を使う（[`references/known-gaps.md`](references/known-gaps.md)）。
11. **ビルド・動作確認**: `npm run build`/`npm run dev` の後、ブラウザで実際に地図・マーカー・
    ポップアップ・クラスタリング・図形の動作を確認する。プレースホルダー API キーでも
    ベースタイルは表示される（フォントグリフの取得のみ 403 になるが無害）ため、実キーが
    無くても UI ロジックの確認は進められる。ただし本番投入前には実キーでの最終確認が必要。

## 手を動かす前に知っておくべきこと

- `@geolonia/maps-suite` は「Google Maps 互換」であって「完全再現」ではない。棚卸し
  （手順 1）を省略すると実装途中で手戻りが発生する。カバー範囲は版ごとに広がるので、
  **このスキルの記述ではなくインストール済みパッケージの型定義を正とする**こと。
- 土台に降りるときは公開 API を使う。地図は `map.getGeoloniaMap()`（MapLibre GL JS の
  `Map` を継承した `GeoloniaMap` が返る）、マーカーは `marker.getMapLibreMarker()`、
  初期化待ちは `map.whenReady()`。`_getImpl()` / `_whenReady()` は内部用なので新規コードに
  書かない。
- 降りる前に、まず公式 API で書けないか確かめる。エスケープハッチが要るのは
  「図形のクリック判定」「大量フィーチャの一括描画」「MapLibre 固有の表現」に限られる。
  なお `getGeoloniaMap()` 経由で center / zoom / tilt / heading を直接変更した場合の動作は
  保証されない。カメラ操作は maps-suite の API を使う。
- ライブラリ由来のバグか疑わしい挙動に遭遇したら、アプリのコードから切り離した最小の
  再現用 HTML（`dist/maps-suite.js` の IIFE バンドル + 簡単な `http-server`）を先に書いて
  確認する方が早い。
- 共有のデモ用 Geolonia API キーは無い。実キーが必要な場面とプレースホルダーで
  十分な場面を区別すると、キー発行待ちで作業を止めずに済む。

## 既知のギャップ（v1.2.2 時点）

詳細と回避策は [`references/known-gaps.md`](references/known-gaps.md)。
**より新しい版を使っている場合は、ここに「無い」と書かれていても型定義を先に確認すること。**

- 図形クラス（Polyline/Polygon/Rectangle/Circle）が `click` イベントを発火しない
- 図形・マーカーのオプションが最小セット（`editable`/`draggable`/`zIndex`/`label` 等が無い）
- `MapOptions` に `gestureHandling`/`mapTypeId`/`minZoom`/`maxZoom` などが無い
- Geocoder / Directions / Places など サービス系 API が未実装
  （`importLibrary("places")` は警告を出して空オブジェクトを返す）

## リファレンス

- [`references/known-gaps.md`](references/known-gaps.md) — 残っているギャップと回避策
- [`references/api-differences.md`](references/api-differences.md) — Google Maps と maps-suite で細部が異なる API（`MapOptions` の対応表と既定値、カメラ操作、`InfoWindow.open()` の引数、`importLibrary()` のカバー範囲など）
- [`references/marker-icons.md`](references/marker-icons.md) — マーカーアイコン（`SymbolPath` によるベクター記号、画像 URL、data URI の使い分け）
- [`references/shapes.md`](references/shapes.md) — 図形クラスの移行、パスの動的更新、クリックイベントが必要な場合の実装例

## 関連スキル

- [`geolonia-map`](../maps/SKILL.md) — 移行後の実装で Embed API / JavaScript API を使う際の一般的なガイド（新規実装向け）
