# Geolonia Mapbox 移行 クイックリファレンス（エージェント向け）

`SKILL.md` の凝縮版。記述は `@geolonia/maps-core` **v0.8.0**（`maplibre-gl` v6 系）と CDN の `embed/v5`（MapLibre GL JS v5.19.0）の時点。詳細は同ディレクトリの `references/` を参照する。

インストール済みの版がここより新しい場合は、この文書ではなく `node_modules/@geolonia/maps-core/dist/npm/index.d.ts` と `node_modules/maplibre-gl/dist/maplibre-gl.d.ts` を正とする。

## 要点

- MapLibre GL JS は Mapbox GL JS v1.13 から分岐した。v1 時代からある API（`Map`、`Marker`、`Popup`、`addSource`、`addLayer`、イベント、式）は名前空間の置き換えだけで動く。
- npm の `mapbox-gl` は `@geolonia/maps-core` に移す（`npm install @geolonia/maps-core maplibre-gl`）。`GeoloniaMap` は `maplibregl.Map` を継承している。ESM 専用。
- script タグの Mapbox GL JS は CDN の `embed/v5` に移す（`geolonia.Map`）。こちらは MapLibre GL JS v5.19.0 で、worker の設定は要らない。
- `mapboxgl.accessToken` は消す。npm 版では Geolonia のスタイルを使うときだけ `apiKey` を渡す。CDN の URL の `geolonia-api-key` は外部スタイルだけを使う場合も省けない（値はプレースホルダーでよい）。

## 対応表（詳細は references/）

| Mapbox GL JS | Geolonia Maps |
| --- | --- |
| `import mapboxgl from 'mapbox-gl'` | `import { GeoloniaMap } from '@geolonia/maps-core'` と `import { Popup, ... } from 'maplibre-gl'`（default export は無い） |
| `mapbox-gl/dist/mapbox-gl.css` | `maplibre-gl/dist/maplibre-gl.css` と `@geolonia/maps-core/css` |
| `new mapboxgl.Map({...})` | `new GeoloniaMap({...})` |
| `mapboxgl.accessToken = ...` | 消す。必要なら `apiKey` オプション |
| `style: 'mapbox://styles/...'` | `style: 'geolonia/basic-v2'` など、または style.json の URL |
| `'source-layer': 'road'` など Mapbox Streets のレイヤー名 | OpenMapTiles のレイヤー名（`transportation` など）に書き直す |
| `new mapboxgl.Marker()` / `Popup` / `NavigationControl` | `maplibre-gl` から import した同名のクラス（マーカーは `GeoloniaMarker` も可） |
| `map.setFog({...})` | `map.setSky({...})`（プロパティ名が違う） |
| `setFreeCameraOptions()` | `calculateCameraOptionsFromCameraLngLatAltRotation()` の結果を `jumpTo` / `easeTo` / `flyTo` に渡す |
| `map.setProjection('globe')` | `map.setProjection({ type: 'globe' })` |
| `map.on(...).on(...)`（チェーン） | 分けて書く（`on()` は `Subscription` を返す） |
| `map.loadImage(url, callback)`、クラスタ取得のコールバック | `await map.loadImage(url)` など Promise で書く |
| `preserveDrawingBuffer` などの WebGL オプション | `canvasContextAttributes: { preserveDrawingBuffer: true }` |
| `.mapboxgl-ctrl` などの CSS | `.maplibregl-ctrl` など |

## Do not（やってはいけない）

- `setWorkerUrl()` を書かずに npm 版を使わない。バンドラによっては、エラーも出ないまま地図が表示されなくなる。Vite は `?worker&url`、webpack や esbuild は `maplibre-gl-worker.mjs` と `maplibre-gl-shared.mjs` の 2 つをコピーする。
- `GeoloniaMap` の既定値を Mapbox と同じだと思い込まない。ズームのコントロール、Geolonia のロゴ、ローディング表示、ジェスチャ操作（スクロールするページで 2 本指や修飾キーを求める）が既定で有効。
- `GeoloniaMap` の `style` にオブジェクトを渡さない（例外になる）。URL にするか、有効なスタイルの URL で作ってから `map.setStyle(obj)` で渡す。`setStyle()` の後は自前のソースとレイヤーを足し直す。
- API キーを渡さないのに `style` を省略しない（既定の Geolonia のスタイルになり、例外になる）。
- `geoloniaControl: false` でロゴが消えると考えない（v0.8.0 では位置だけ変えられる）。
- `mapbox://` の URL を残さない（例外は出ず、地図が表示されないだけになる）。Mapbox Studio のスタイルを書き出しただけで使えると考えない（タイルのスキーマが違う）。
- `setFog`、`setConfigProperty`、`addImport`、`slot`、`type: 'model'` を MapLibre の版を上げれば使えると考えない。名前が違うか、対応するものが無い。
- CDN の `embed/v5` で MapLibre v6 の API を使わない（v5.19.0 が同梱されている）。CDN の URL から `geolonia-api-key` を省かない（外部スタイルだけでも必要）。
- MapLibre の API を Geolonia 用に書き換えようとしない。`GeoloniaMap` は `maplibregl.Map` そのもののメソッドとイベントを持つ。
- API キーを公開リポジトリやコミットに直書きしない。
