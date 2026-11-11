# Mapbox GL JS と Geolonia Maps の API の違い

記述は `@geolonia/maps-core` v0.8.0（`maplibre-gl` v6 系）と CDN の `embed/v5`（MapLibre GL JS v5.19.0 を同梱）の時点。インストールした版がこれより新しい場合は、`node_modules/@geolonia/maps-core/dist/npm/index.d.ts` と `node_modules/maplibre-gl/dist/maplibre-gl.d.ts` を正とする。

「Mapbox にあって Geolonia Maps に無いもの」は [`known-gaps.md`](known-gaps.md) を参照。

## インストールと import

```sh
npm uninstall mapbox-gl
npm install @geolonia/maps-core maplibre-gl
```

```js
// Before（Mapbox GL JS）
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.xxxx';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [139.7671, 35.6812],
  zoom: 14,
});
new mapboxgl.Marker().setLngLat([139.7671, 35.6812]).setPopup(new mapboxgl.Popup().setText('東京駅')).addTo(map);
map.addControl(new mapboxgl.ScaleControl());
```

```js
// After（@geolonia/maps-core）
import 'maplibre-gl/dist/maplibre-gl.css';
import '@geolonia/maps-core/css';
import { Marker, Popup, ScaleControl } from 'maplibre-gl';
import { GeoloniaMap } from '@geolonia/maps-core';

const map = new GeoloniaMap({
  container: 'map',
  apiKey: import.meta.env.VITE_GEOLONIA_API_KEY, // Geolonia のスタイルを使う場合のみ
  style: 'geolonia/basic-v2',
  center: [139.7671, 35.6812],
  zoom: 14,
});
new Marker().setLngLat([139.7671, 35.6812]).setPopup(new Popup().setText('東京駅')).addTo(map);
map.addControl(new ScaleControl());
```

- `maplibre-gl` v6 と `@geolonia/maps-core` は **ESM 専用**。`require()` では読めない。
- `maplibre-gl` v6 には default export が無い。`import maplibregl from 'maplibre-gl'` ではなく、名前付きで import するか `import * as maplibregl from 'maplibre-gl'` とする。
- CSS は `maplibre-gl/dist/maplibre-gl.css` と `@geolonia/maps-core/css` の 2 つが要る。
- `mapboxgl.accessToken` に相当するものは無い。Geolonia のスタイルとタイルを使う場合だけ `apiKey` を渡す。外部の style.json を使う場合は API キーは要らない。

## worker の設定

`maplibre-gl` v6 は worker を `import.meta.url` を基準にした実際の URL から読み込む。多くのバンドラはこのファイルを出力に含めないので、最初の地図を作る前に `setWorkerUrl()` を一度呼ぶ。忘れると、例外もコンソールのエラーも無いまま地図が表示されない。

worker は 2 つのファイルでできている。`maplibre-gl-worker.mjs` は、同じディレクトリの `maplibre-gl-shared.mjs` を import するだけの小さなファイル。そのため、ファイルをそのままコピーする方式では 2 つとも出力に置く必要がある。

Vite は worker 用の処理で 1 つのファイルにまとめてくれる（`?worker&url` が必要。`?url` だけでは足りない）。

```js
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { setWorkerUrl } from 'maplibre-gl';

setWorkerUrl(workerUrl);
```

webpack や esbuild では 2 つのファイルを出力先にコピーし、そのコピーを指す。webpack で `new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url)` と書くと、`maplibre-gl-shared.mjs` が出力されず worker の読み込みに失敗する。

```js
// webpack なら copy-webpack-plugin で、esbuild ならビルドの後に cp で、
// node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs と maplibre-gl-shared.mjs を出力先へコピーしておく
import { setWorkerUrl } from 'maplibre-gl';

setWorkerUrl('/maplibre-gl-worker.mjs');
```

Content-Security-Policy を設定しているページで、CDN から ES モジュールとして MapLibre を読み込む場合は、worker が Blob URL から動くので `worker-src blob:` を許可する。

## `GeoloniaMap` のオプションと既定値

`GeoloniaMap` は `maplibregl.Map` を継承している。`MapOptions` はそのまま渡せて、メソッドとイベントもすべて使える。そのうえで次のオプションが加わり、いくつかの既定値が Mapbox GL JS と違う。

| オプション | 既定値 | Mapbox GL JS との違い |
| --- | --- | --- |
| `apiKey` | なし | Geolonia のスタイルとタイルを使うときに必要。`accessToken` の代わり |
| `style` | `'geolonia/basic-v2'` | Geolonia のスタイル名、style.json の URL、相対パスのいずれか。`mapbox://` は使えない |
| `navigationControl` | `true` | ズームと回転のコントロールが既定で出る。消すなら `false` |
| `geoloniaControl` | `true` | Geolonia のロゴが出る |
| `gestureHandling` | `true` | スクロールできるページでは、地図を動かすのに 2 本指や修飾キーが要る。Mapbox と同じ操作にするなら `false` |
| `loader` | `true` | 読み込み中にアニメーションを表示する |
| `lang` | `'auto'` | ラベルの言語。`'ja'` / `'en'` / `'auto'`（ブラウザの言語に従う） |
| `geolocateControl` / `fullscreenControl` / `scaleControl` | `false` | `true` か表示位置（`'top-right'` など）を渡すと表示される |
| `marker` | なし（表示しない） | `true` にすると `center` にマーカーを置く |
| `3d` | `false` | 対応するスタイルで建物などを 3D 表示する |

- `container` は要素、要素の ID、CSS セレクタのどれでもよい。Mapbox と同じ `container: 'map'` で動く。
- 帰属表示（attribution）は Geolonia の独自のコントロールに置き換わる。`attributionControl` を渡しても使われない。
- `transformRequest` も渡せる。Geolonia のソースへのリクエストでは、API キーなどを付けた後の URL が渡される。後から `map.setTransformRequest()` で差し替えると、Geolonia 側が付けるパラメータも外れる点に注意する。
- Geolonia の既定の見た目のマーカーが欲しい場合は、`maplibre-gl` の `Marker` の代わりに `@geolonia/maps-core` の `GeoloniaMarker` を使う。

## スタイルとレイヤー

- `mapbox://styles/...` の代わりに、Geolonia のスタイル（`geolonia/basic-v2`、`geolonia/gsi`、`geolonia/midnight` など。一覧は [`geolonia-map`](../../maps/SKILL.md) スキルの `styles.md`）か、自前または外部の style.json を指定する。
- Geolonia のタイルは OpenMapTiles 互換のスキーマで、Mapbox Streets のスキーマとはレイヤー名も属性名も違う。ベースマップのソースを参照して足していたレイヤー（`source: 'composite'`、`'source-layer': 'road'` など）は、OpenMapTiles のレイヤー名（`transportation` など）に合わせて書き直す。
- 自前の GeoJSON ソースや自前のタイルから作ったレイヤーは、ソースの URL が `mapbox://` でなければそのまま動く。
- ラベルの下に自前のレイヤーを入れていた場合は、`addLayer(layer, beforeId)` の `beforeId` を、移行先のスタイルのラベルのレイヤー ID に合わせる。Mapbox Standard スタイルの `slot` は使えない。

## script タグで読み込んでいる場合

`<script src="https://api.mapbox.com/mapbox-gl-js/...">` で読み込んでいるページは、CDN の `embed/v5` に置き換える。グローバル変数は `mapboxgl` ではなく `geolonia` になり、MapLibre GL JS のクラスが `geolonia.Map` / `geolonia.Marker` / `geolonia.Popup` のように使える。

```html
<!-- Before（Mapbox GL JS） -->
<link href="https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl.css" rel="stylesheet" />
<script src="https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl.js"></script>
<script>
  mapboxgl.accessToken = 'pk.xxxx';
  const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/streets-v12', center: [139.7671, 35.6812], zoom: 14 });
</script>

<!-- After（Geolonia Maps の CDN） -->
<script src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>
<script>
  const map = new geolonia.Map({ container: 'map', style: 'geolonia/basic-v2', center: [139.7671, 35.6812], zoom: 14 });
</script>
```

- API キーは `<script>` の URL の `geolonia-api-key` で渡す。外部の style.json だけを使う場合も、このパラメータ自体は省略できない（無いと `Cannot load API key.` で止まる）。その場合、値はプレースホルダー（`YOUR-API-KEY`）のままでも外部のスタイルは表示される。
- CSS は embed に同梱されているので、`<link>` は要らない。
- `embed/v5` が同梱しているのは **MapLibre GL JS v5.19.0**。npm の `@geolonia/maps-core`（v6）とは版が違い、v6 で入った API は使えない。逆に、v5 の書き方（`maplibregl` の UMD と同じ使い方）がそのまま動き、worker の設定も要らない。
- `class="geolonia"` を持つ要素は、embed が自動で地図に変換する。移行先のページで別の用途にこのクラス名を使っていないか確かめる。
- 詳しい使い方は [`geolonia-map`](../../maps/SKILL.md) スキルの `javascript-api.md` と `embed-api.md`。

## CSS のクラス名

Mapbox GL JS の UI の CSS クラスは `mapboxgl-` で始まり、MapLibre GL JS では `maplibregl-` で始まる。`.mapboxgl-ctrl`、`.mapboxgl-popup-content`、`.mapboxgl-marker` などを上書きしていた CSS は、接頭辞を `maplibregl-` に置き換える。
