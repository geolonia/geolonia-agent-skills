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

1. **棚卸し（最初にやる）**: 対象コードが使っている Google Maps API を洗い出す。
   `Polyline`/`Polygon`/`Circle`、ベクター記号アイコン（`SymbolPath`）、`Geocoder`/
   `DirectionsService`/`Places`、`gestureHandling` 等の `MapOptions` は maps-suite に
   **存在しない**ため、見つかった場合は先に回避策を確認しておく
   （[`references/known-gaps.md`](references/known-gaps.md)）。
2. **インストール**: `npm install @geolonia/maps-suite maplibre-gl`
   （`maplibre-gl` は peer dependency）。
3. **API キーの取得**: [app.geolonia.com](https://app.geolonia.com/) のコンソールで発行する
   （組織内に共有のデモキーは無い）。外部の style.json を使う場合は不要。
4. **ローダーの置き換え**: `@googlemaps/js-api-loader` を
   `import { geolonia } from '@geolonia/maps-suite'` に置き換える
   （[`references/api-differences.md`](references/api-differences.md)）。
5. **地図の初期化**: `new geolonia.maps.Map(el, { center, zoom, style, apiKey })`。
   `gestureHandling`/`fullscreenControl`/`streetViewControl`/`mapTypeId` は削除する
   （[`references/api-differences.md`](references/api-differences.md)）。
6. **マーカー・ポップアップ・クラスタリング**: `geolonia.maps.Marker`/`MarkerClusterer`
   はほぼそのまま移植できる。`InfoWindow.open()` の引数の形が異なる点に注意
   （[`references/api-differences.md`](references/api-differences.md)）。
7. **ベクター記号アイコン（SymbolPath）**: `icon` は `{ url: string }` のみ対応。SVG data URI
   で代替する（[`references/marker-icons.md`](references/marker-icons.md)）。
8. **Polyline / 線・面データ**: 相当するクラスが無いため、`map._getImpl()` で取得した
   MapLibre インスタンスに `addSource`/`addLayer` する。地図の読み込みが完了するまで
   （`idle` イベント等で判定）は呼び出せない
   （[`references/polyline-workaround.md`](references/polyline-workaround.md)）。
9. **パン＋ズームの組み合わせに注意**: `map.panTo()` の直後に `map.setZoom()` を呼ぶと
   パン先ではなく元の位置のままズームされる（[`references/known-gaps.md`](references/known-gaps.md)）。
10. **ビルド・動作確認**: `npm run build`/`npm run dev` の後、ブラウザで実際に地図・マーカー・
    ポップアップ・クラスタリングの動作を確認する。プレースホルダー API キーでもベースタイルは
    表示される（フォントグリフの取得のみ 403 になるが無害）ため、実キーが無くても UI ロジックの
    確認は進められる。ただし本番投入前には実キーでの最終確認が必要。

## 手を動かす前に知っておくべきこと（振り返り）

実際の移行作業（`_poc/google-maps-projects/vanilla` 配下 4 プロジェクト）で得られた教訓。
詳細は各リファレンスを参照。

- `@geolonia/maps-suite` は「Google Maps 互換」であって「完全再現」ではない。棚卸し
  （手順 1）を省略すると実装途中で手戻りが発生する。
- `map._getImpl()`/`map._whenReady()` は「内部用」と書かれているが実行時には普通に呼び出せる。
  maps-suite がカバーしていない機能は最初からこのエスケープハッチを使う前提で設計した方が早い。
- `panTo()` + `setZoom()` の組み合わせは Google Maps では動くが maps-suite では壊れる
  （詳細: [`references/known-gaps.md`](references/known-gaps.md)）。この不具合は原因が
  非自明で、単体の再現用 HTML を書いて初めて切り分けられた。
- 組織内に共有のデモ用 Geolonia API キーは無い。実キーが必要な場面とプレースホルダーで
  十分な場面を区別すると、キー発行待ちで作業を止めずに済む。
- ライブラリ由来のバグか疑わしい挙動に遭遇したら、アプリのコードから切り離した最小の
  再現用 HTML（`dist/maps-suite.js` の IIFE バンドル + 簡単な `http-server`）を先に書いて
  確認する方が早い。

## 既知のギャップ（未対処・upstream で追跡中）

以下は `@geolonia/maps-suite` 側で対応されるべきギャップとして
[geolonia/maps-suite](https://github.com/geolonia/maps-suite/issues) に issue を起票済み。
対処されるまでは [`references/known-gaps.md`](references/known-gaps.md) の回避策を使うこと。

- [geolonia/maps-suite#71](https://github.com/geolonia/maps-suite/issues/71) — Polyline 相当のクラスが存在しない
- [geolonia/maps-suite#72](https://github.com/geolonia/maps-suite/issues/72) — Marker アイコンがベクター記号（SymbolPath.CIRCLE 等）に対応していない
- [geolonia/maps-suite#73](https://github.com/geolonia/maps-suite/issues/73) — panTo() 直後の setZoom() がパンをキャンセルしてしまう（互換性バグ、重要度高）

## リファレンス

- [`references/known-gaps.md`](references/known-gaps.md) — maps-suite に無い機能と回避策の一覧（上記 3 件の詳細）
- [`references/api-differences.md`](references/api-differences.md) — Google Maps と maps-suite で細部が異なる API（InfoWindow.open() の引数、importLibrary() のカバー範囲、MapOptions の非対応フィールドなど）
- [`references/marker-icons.md`](references/marker-icons.md) — ベクター記号アイコン（SymbolPath.CIRCLE 等）を SVG data URI で代替する実装例
- [`references/polyline-workaround.md`](references/polyline-workaround.md) — Polyline/Polygon を MapLibre の GeoJSON line/fill レイヤーで代替する実装例

## 関連スキル

- [`geolonia-map`](../maps/SKILL.md) — 移行後の実装で Embed API / JavaScript API を使う際の一般的なガイド（新規実装向け）
