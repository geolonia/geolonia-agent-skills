# Geolonia Google Maps 移行 クイックリファレンス（エージェント向け）

`SKILL.md` の凝縮版。詳細は同ディレクトリの `references/` を参照する。

## 要点

- 移行先は `@geolonia/maps-suite`（`npm install @geolonia/maps-suite maplibre-gl`）。
  Google Maps 互換クラスを `geolonia.maps.*` として提供する。
- ローダーは `import { geolonia } from '@geolonia/maps-suite'` の一択。
  `geolonia.maps.importLibrary()` は `InfoWindow` を返さないため使わない。
- API キーは [app.geolonia.com](https://app.geolonia.com/) のコンソールで発行する
  （組織内に共有デモキーは無い）。プレースホルダーキーでも `geolonia/gsi` 等のベースタイル
  は表示されるため、UI ロジックの動作確認自体は実キー無しでも進められる。

## 対応表（詳細は references/api-differences.md）

| Google Maps                          | @geolonia/maps-suite                         |
| ------------------------------------- | --------------------------------------------- |
| `new google.maps.Map(el, opts)`       | `new geolonia.maps.Map(el, { ...opts, style, apiKey })` |
| `new google.maps.Marker(opts)`        | `new geolonia.maps.Marker(opts)`（ほぼ同じ）    |
| `new google.maps.InfoWindow(opts)`    | `new geolonia.maps.InfoWindow(opts)`           |
| `infoWindow.open({ map, anchor })`    | `infoWindow.open(map, anchor)`（位置引数）      |
| `new MarkerClusterer({ map, markers })` | `new geolonia.maps.MarkerClusterer({ map, markers })` |
| `new google.maps.Polyline(...)`       | **存在しない**。`map._getImpl()` + `addSource`/`addLayer`（line）で代替 |
| `icon: { path: SymbolPath.CIRCLE, ... }` | **存在しない**。SVG data URI を `icon: { url }` に渡して代替 |

## Do not（やってはいけない）

- `map.panTo(latLng)` の直後に `map.setZoom(zoom)` を呼ばない。MapLibre の `setZoom()`
  （内部で `jumpTo()`）が進行中の `panTo()` アニメーションをキャンセルし、パン先ではなく
  元の位置のままズームされる。1 回の `map._getImpl().easeTo({ center, zoom })` にまとめる。
- 棚卸し（`Polyline`/`Polygon`/`Circle`/ベクター記号アイコンの有無）をせずに移行を始めない。
  実装の途中で「無い」と気づくと手戻りが大きい。
- `MapOptions` に `gestureHandling` / `fullscreenControl` / `streetViewControl` / `mapTypeId`
  を渡さない（存在しないフィールドなので意味を持たない）。
- `map._getImpl()` / `map._whenReady()` の存在を隠さない。maps-suite がカバーしていない
  機能は最初からこのエスケープハッチを使う前提で設計する。
- `tmp/geolonia-maps/sdk/issues/maps-suite/` の既知ギャップを確認せずに「バグかもしれない」
  挙動を延々自前のコードだけデバッグしない。ライブラリ単体の最小再現 HTML で先に切り分ける。
