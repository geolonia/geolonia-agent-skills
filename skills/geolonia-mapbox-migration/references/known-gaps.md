# Mapbox 固有の機能と、その代わりに使うもの

記述は `@geolonia/maps-core` v0.8.0（`maplibre-gl` v6 系）と CDN の `embed/v5`（MapLibre GL JS v5.19.0）の時点。ここに「無い」と書いた API でも、新しい版で入っていることがある。代替を書く前に、インストール済みの `maplibre-gl` の型定義をその名前で検索する。

Mapbox の名前で見つからない API を「MapLibre の版が古いせい」と考えて版を上げても、ほとんどの場合は解決しない。分岐後に別々に作られた機能は、MapLibre では別の名前になっている。

## 名前を変えれば使えるもの

| Mapbox GL JS | Geolonia Maps（MapLibre GL JS） | 補足 |
| --- | --- | --- |
| `map.setFog({...})`、スタイルの `fog` | `map.setSky({...})`、スタイルの `sky` | 1 対 1 には対応しない。プロパティ名が違い（`sky-color`、`horizon-color`、`fog-color` など）、`fog-color` などは 3D 地形（`setTerrain`）を有効にしたときだけ効く。値を移し替えたうえで見た目を確かめる |
| `map.setFreeCameraOptions()` | `map.calculateCameraOptionsFromCameraLngLatAltRotation(...)` の結果を `jumpTo` / `easeTo` / `flyTo` に渡す | カメラの位置（経緯度と高さ）と回転から、カメラのオプションを計算する |
| `map.getFreeCameraOptions()` | 相当するものは無い | カメラ自体の位置を返す API は無い。現在のカメラを読んで書き換えるコードは、`getCenter()` / `getZoom()` / `getPitch()` / `getBearing()` で扱うように書き直す |
| `projection: 'globe'`、`map.setProjection('globe')` | `map.setProjection({ type: 'globe' })`、スタイルの `projection` | 文字列ではなくオブジェクトで渡す |
| `map.setTerrain({ source: 'mapbox-dem' })` | `map.setTerrain({ source, exaggeration })` | 書き方は同じ。ただし `mapbox://` の DEM は使えないので、`raster-dem` のソースを別に用意する |
| CSS クラス `mapboxgl-*` | CSS クラス `maplibregl-*` | 接頭辞を置き換える |

## 対応するものが無いもの

### `mapbox://` のスタイル・ソース・スプライト・グリフ

`mapbox://` で始まる URL は Mapbox のアクセストークンで認証されるもので、Geolonia Maps では読み込めない。

- ベースマップは Geolonia のスタイル（`geolonia/basic-v2` など）か、自前または外部の style.json に置き換える。
- Mapbox Studio で作ったスタイルは、style.json として書き出しても、ソースが Mapbox のタイルを指していて、レイヤーも Mapbox Streets のスキーマを前提にしている。Geolonia のタイル（OpenMapTiles 互換）に載せ替えるには、ソースの URL に加えて、各レイヤーの `source-layer` とフィルタで参照する属性名を書き直す必要がある。見た目を再現するより、Geolonia のスタイルから出発して足りない表現を足すほうが早いことが多い。
- フォントのグリフは `https://glyphs.geolonia.com/{fontstack}/{range}.pbf` を使える。提供しているフォントは `Noto Sans CJK JP Regular` / `Noto Sans CJK JP Bold` / `Noto Sans CJK JP Light` / `Noto Sans Regular` / `Noto Sans Universal Regular` だけで、`text-font` に複数のフォントを並べると取得に失敗する。移行元の `text-font`（`['DIN Pro Medium', 'Arial Unicode MS Regular']` など）は、このうち 1 つに置き換える。

### Mapbox Standard スタイルとその設定 API

Mapbox GL JS v3 の Standard スタイル、`setConfigProperty`、style imports（`addImport` / スタイルの `imports`）、レイヤーの `slot` は MapLibre に無い。

- 時間帯による明るさの切り替えなどは、Geolonia のスタイル（`geolonia/midnight` など）の切り替え（`map.setStyle()`）や、レイヤーの `setPaintProperty` で個別に書く。`setStyle()` でスタイルが作り直されると自前のソース・レイヤー・画像が消える（差分だけが当たった場合は残ることもある）ので、[`api-differences.md`](api-differences.md) の「スタイルを差し替えるとき」の手順で足し直す。
- `slot` で自前のレイヤーの重なり順を決めていた場合は、`map.addLayer(layer, beforeId)` の `beforeId` に、移行先のスタイルのレイヤー ID を指定する。

### 3D モデルレイヤー

Mapbox GL JS v3 のモデルレイヤー（`type: 'model'`）は MapLibre に無い。glTF などのモデルを置く必要がある場合は、カスタムレイヤー（`type: 'custom'`、`CustomLayerInterface`）に three.js などを組み合わせて描く。建物を立体で見せるだけなら、`fill-extrusion` レイヤーか、`GeoloniaMap` の `3d: true`（対応するスタイルのみ）で足りることが多い。

### Mapbox の REST API とプラグイン

| Mapbox の機能 | 代わりに使うもの |
| --- | --- |
| Geocoding API、`@mapbox/mapbox-gl-geocoder` | 日本の住所なら [`geolonia-map`](../../maps/SKILL.md) スキルの `geocoding.md`（Community Geocoder、住所の正規化）。座標から都道府県・市区町村を引く逆ジオコーディングも同じページの Open Reverse Geocoder。日本以外の住所や施設名の検索は Geolonia Maps に無いので、別のサービスを組み合わせる |
| Directions API、`@mapbox/mapbox-gl-directions` | Geolonia Maps に無い。OSRM や Valhalla などの経路検索を別に用意し、結果の線を GeoJSON のレイヤーとして描く |
| Search Box、Isochrone、Matrix、Static Images などの API | Geolonia Maps に無い。必要なものごとに別のサービスを探す |
| `@mapbox/mapbox-gl-draw` などの UI プラグイン | MapLibre でもそのまま動くものがあるが、版によって CSS のクラス名や内部 API の違いで崩れることがある。MapLibre 向けの代替（[awesome-maplibre](https://github.com/maplibre/awesome-maplibre) に一覧がある）を先に探し、無ければ実際に動かして確かめる |

公開されている無料のサービス（Nominatim や OSRM のデモサーバーなど）は、利用規約で本番の利用を制限していることが多い。本番で使う前に規約を確かめ、必要なら自前でホストする。
