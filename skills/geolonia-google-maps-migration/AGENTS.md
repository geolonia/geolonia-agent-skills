# Geolonia Google Maps 移行 クイックリファレンス（エージェント向け）

`SKILL.md` の凝縮版。記述は `@geolonia/maps-suite` **v1.2.2** 時点。詳細は同ディレクトリの
`references/` を参照する。

**常に最新版を使う。** インストール済みの版がここより新しい場合は、この文書ではなく
`node_modules/@geolonia/maps-suite/dist/npm/index.d.ts` を正とする。

## 要点

- 移行先は `@geolonia/maps-suite`（`npm install @geolonia/maps-suite maplibre-gl`）。
  Google Maps 互換クラスを `geolonia.maps.*` として提供する。
- ローダーは `import { geolonia } from '@geolonia/maps-suite'`。
  `geolonia.maps.importLibrary()` も使えるが、`geolonia.maps.*` を直接参照する方が
  書き分けが要らず簡単。
- API キーは [app.geolonia.com](https://app.geolonia.com/) のコンソールで発行する
  （組織内に共有デモキーは無い）。プレースホルダーキーでも `geolonia/gsi` 等のベースタイル
  は表示されるため、UI ロジックの動作確認自体は実キー無しでも進められる。
- 図形・ベクター記号アイコン・カメラ操作・GeoJSON（`map.data`）はすべて公式 API がある。
  **古い回避策（自前レイヤーで線を引く / SVG data URI で丸マーカーを作る /
  `easeTo` に手でまとめる）を新規コードに書かない。**
- 土台に降りるときは公開 API を使う（`map.getGeoloniaMap()` / `marker.getMapLibreMarker()` /
  `map.whenReady()`）。

## 対応表（詳細は references/api-differences.md）

| Google Maps                              | @geolonia/maps-suite                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `new google.maps.Map(el, opts)`          | `new geolonia.maps.Map(el, { ...opts, style, apiKey })`                                    |
| `new google.maps.Marker(opts)`           | `new geolonia.maps.Marker(opts)`（ほぼ同じ）                                               |
| `icon: { path: SymbolPath.CIRCLE, ... }` | 同じ書き方でよい（`geolonia.maps.SymbolPath`）                                             |
| `new google.maps.InfoWindow(opts)`       | `new geolonia.maps.InfoWindow(opts)`（`content` のみ）                                     |
| `infoWindow.open({ map, anchor })`       | `infoWindow.open(map, anchor)`（**位置引数**）                                             |
| `new MarkerClusterer({ map, markers })`  | `new geolonia.maps.MarkerClusterer({ map, markers })`                                      |
| `new google.maps.Polyline(...)`          | `new geolonia.maps.Polyline(...)`（Polygon / Rectangle / Circle も同様）                   |
| `polygon.addListener('click', ...)`      | **発火しない**。`map.getGeoloniaMap()` で自前レイヤーを描いて `impl.on('click', layerId, ...)` |
| `map.moveCamera({...})` / `setHeading()` | 同名で使える（`setTilt()` も）                                                             |
| `new google.maps.Geocoder()` など        | **存在しない**。community-geocoder 等を別途組み合わせる                                    |
| `map.data.addGeoJson(...)`               | 同名で使える（`geolonia.maps.Data`。`setStyle` / `toGeoJson` も）                          |

## Do not（やってはいけない）

- 棚卸し（サービス系 API・図形のクリック・`draggable`/`editable` の有無）をせずに移行を
  始めない。実装の途中で「無い」と気づくと手戻りが大きい。
- `MapOptions` に `gestureHandling` / `mapTypeId` / `minZoom` / `maxZoom` /
  `fullscreenControl` / `streetViewControl` を渡さない（存在しないフィールド）。
  既定 UI を消すなら `disableDefaultUI: true` で一括指定する。
- `center` / `zoom` の指定漏れを放置しない。既定値は `{ lat: 0, lng: 0 }` / `zoom: 0`（全球）。
  Google Maps と違い、省略してもエラーにならず静かに全球表示になる。
- 平面表示前提の UI で `threeDimensional` を省略しない。既定で 3D 建物が **ON**。
- `panTo()` と `setZoom()` の間に `await` や `setTimeout` を挟まない。同じ同期処理の中で
  続けて呼べば 1 回のカメラ操作にまとまるが、間が空くとパンが中断される。まとめたいときは
  `moveCamera({ center, zoom })`。
- `Point` / `Size` のインスタンスを後から書き換えない（凍結されている。作り直す）。
- 新規コードに `_getImpl()` / `_whenReady()` を書かない。公開 API の
  `map.getGeoloniaMap()` / `marker.getMapLibreMarker()` / `map.whenReady()` を使う。
  降りる前に、まず公式 API で書けないか確かめる。
- `references/known-gaps.md`（ライブラリ側の既知の制限）を確認せずに「バグかもしれない」
  挙動を延々自前のコードだけデバッグしない。ライブラリ単体の最小再現 HTML で先に切り分ける。
