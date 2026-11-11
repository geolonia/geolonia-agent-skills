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

// この前に setWorkerUrl() が必要（下の「worker の設定」を参照）
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
- `mapboxgl.accessToken` に相当するものは無い。Geolonia のスタイルかタイルを使う場合だけ `apiKey` を渡す。Geolonia のスタイルもタイルも参照しない外部の style.json だけを使う場合は、API キーは要らない。

## worker の設定

`maplibre-gl` v6 は worker を `import.meta.url` を基準にした実際の URL から読み込む。多くのバンドラはこのファイルを出力に含めないので、最初の地図を作る前に `setWorkerUrl()` を一度呼ぶ。忘れると、例外もコンソールのエラーも無いまま地図が表示されない。

worker は `maplibre-gl-worker.mjs` と `maplibre-gl-shared.mjs` の 2 つのファイルでできている。`maplibre-gl` の版によっては、`maplibre-gl-worker.mjs` が同じディレクトリの `maplibre-gl-shared.mjs` を import する（6.17.0 では `maplibre-gl-worker.mjs` だけで動き、`maplibre-gl-shared.mjs` は空）。ファイルをそのままコピーする方式では、版によらず動くように 2 つとも出力に置く。

Vite は worker 用の処理で 1 つのファイルにまとめてくれる（`?worker&url` が必要。`?url` だけでは足りない）。

```js
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { setWorkerUrl } from 'maplibre-gl';

setWorkerUrl(workerUrl);
```

webpack や esbuild では 2 つのファイルを出力先にコピーし、そのコピーを指す（esbuild と `maplibre-gl` 6.17.0 の組み合わせで動くことを確かめてある）。webpack で `new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url)` と書くと、`maplibre-gl-shared.mjs` が出力されず worker の読み込みに失敗する。

```js
// webpack なら copy-webpack-plugin で、esbuild ならビルドの後に cp で、
// node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs と maplibre-gl-shared.mjs を出力先へコピーしておく
import { setWorkerUrl } from 'maplibre-gl';

setWorkerUrl('/maplibre-gl-worker.mjs');
```

`/maplibre-gl-worker.mjs` はサイトのルートを指す。アプリを `/app/` のようなサブパスに置く場合は、デプロイ先のベースパスを含めて書く（`setWorkerUrl('/app/maplibre-gl-worker.mjs')`、Vite なら `import.meta.env.BASE_URL` を前に付ける）。`document.baseURI` を基準にすると、`<base>` 要素の無い SPA では開いているページの URL が基準になり、`/app/orders/123` のような URL を直接開いたときに読み込めなくなる。

Content-Security-Policy を設定しているページで、CDN から ES モジュールとして MapLibre を読み込む場合は、worker が Blob URL から動くので `worker-src blob:` を許可する。

## `GeoloniaMap` のオプションと既定値

`GeoloniaMap` は `maplibregl.Map` を継承している。`MapOptions` はそのまま渡せて、メソッドとイベントもすべて使える。そのうえで次のオプションが加わり、いくつかの既定値が Mapbox GL JS と違う。

| オプション | 既定値 | Mapbox GL JS との違い |
| --- | --- | --- |
| `apiKey` | なし | Geolonia のスタイルとタイルを使うときに必要。`accessToken` の代わり |
| `style` | `'geolonia/basic-v2'` | 省略すると Geolonia のスタイルになるので、API キーが無いと例外になる。**文字列だけ**を受け付ける。Geolonia のスタイル名、style.json の URL、相対パスのいずれか。`mapbox://` は使えない |
| `navigationControl` | `true` | ズームと回転のコントロールが既定で出る。消すなら `false` |
| `geoloniaControl` | `true` | Geolonia のロゴが出る。v0.8.0 では `false` を渡しても消えず、表示位置だけ変えられる |
| `gestureHandling` | `true` | スクロールできるページでは、地図を動かすのに 2 本指や修飾キーが要る。Mapbox と同じ操作にするなら `false` |
| `loader` | `true` | 読み込み中にアニメーションを表示する |
| `lang` | `'auto'` | ラベルの言語。`'ja'` / `'en'` / `'auto'`（ブラウザの言語に従う） |
| `geolocateControl` / `fullscreenControl` / `scaleControl` | `false` | `true` か表示位置（`'top-right'` など）を渡すと表示される |
| `marker` | なし（表示しない） | `true` にすると `center` にマーカーを置く |
| `3d` | `false` | 対応するスタイルで建物などを 3D 表示する |

- `style` にスタイルのオブジェクト（`{ version: 8, sources: ..., layers: ... }`）を渡すと、コンストラクタが `style.startsWith is not a function` で例外を投げる。Mapbox のコードでオブジェクトを渡していた場合は、style.json として配信して URL を渡すか、いったん有効なスタイルの URL（API キーを渡さないなら外部の style.json）で地図を作り、`map.setStyle(styleObject)` で差し替える。
- `style` に `mapbox://...` を残すと、例外にはならず Geolonia のスタイル名として解釈されて取得に失敗し、地図が表示されないだけになる。棚卸しで必ず消す。
- `container` は要素、要素の ID、CSS セレクタのどれでもよい。Mapbox と同じ `container: 'map'` で動く。
- 帰属表示（attribution）は Geolonia の独自のコントロールに置き換わる。`attributionControl` を渡しても使われない。
- `transformRequest` も渡せる。Geolonia のソースへのリクエストでは、API キーなどを付けた後の URL が渡される。後から `map.setTransformRequest()` で差し替えると、Geolonia 側が付けるパラメータも外れる点に注意する。
- Geolonia の既定の見た目のマーカーが欲しい場合は、`maplibre-gl` の `Marker` の代わりに `@geolonia/maps-core` の `GeoloniaMarker` を使う。

## 戻り値とコールバックの違い

名前は Mapbox GL JS v1 と同じでも、MapLibre GL JS で書き方が変わったものがある。

- `map.on()` は地図ではなく `Subscription` を返す。`map.on('load', a).on('click', b)` のようなチェーンは、1 行ずつに分ける（`once()` はハンドラを渡せば地図を返すのでチェーンできる。ハンドラ無しで呼ぶと Promise を返す）。
- `map.loadImage()` は MapLibre では Promise を返す（`const { data } = await map.loadImage(url); map.addImage('id', data);`）。ただし `GeoloniaMap` は後方互換として `loadImage(url, callback)` も受け付けるので、`GeoloniaMap` に移したコードはコールバックのままでも動く。
- GeoJSON ソースの `getClusterExpansionZoom()` / `getClusterChildren()` / `getClusterLeaves()` も Promise を返す。コールバックを渡す書き方のままだと、コールバックは呼ばれない。
- WebGL のオプション（`preserveDrawingBuffer`、`antialias`、`failIfMajorPerformanceCaveat`）は、`MapOptions` の直下ではなく `canvasContextAttributes` の中に書く。直下に書いたままだと効かず、地図の画像の書き出しなどが動かない。

## スタイルとレイヤー

- `mapbox://styles/...` の代わりに、Geolonia のスタイル（`geolonia/basic-v2`、`geolonia/gsi`、`geolonia/midnight` など。一覧は [`geolonia-map`](../../maps/SKILL.md) スキルの `styles.md`）か、自前または外部の style.json を指定する。
- Geolonia のタイルは OpenMapTiles 互換のスキーマで、Mapbox Streets のスキーマとはレイヤー名も属性名も違う。ベースマップのソースを参照して足していたレイヤー（`source: 'composite'`、`'source-layer': 'road'` など）は、OpenMapTiles のレイヤー名（`transportation` など）に合わせて書き直す。
- 自前の GeoJSON ソースや自前のタイルから作ったレイヤーは、ソースの URL が `mapbox://` でなければそのまま動く。ただし `icon-image` は移行先のスタイルのスプライトから探されるので、移行前のスプライトにしか無い画像は表示されない。同じ名前の画像を `map.addImage()` で足すか、画像名を変える。
- `map.setStyle()` でスタイルを差し替えるときは、次の「スタイルを差し替えるとき」の手順で、自前のソース・レイヤー・画像を足し直す。
- ラベルの下に自前のレイヤーを入れていた場合は、`addLayer(layer, beforeId)` の `beforeId` を、移行先のスタイルのラベルのレイヤー ID に合わせる。Mapbox Standard スタイルの `slot` は使えない。

## スタイルを差し替えるとき

`map.setStyle()` でスタイルを作り直すと、`addSource` / `addLayer` / `addImage` で足したソース・レイヤー・画像は消え、`load` も再び発火しない。ただし MapLibre は既定で差分だけを当てるので、作り直されずに一部が残ったり、変更が無くて `style.load` が発火しなかったりもする。そのため、次の 3 点を守ると確実に動く。

- `setStyle()` を呼ぶ**前に** `map.once('style.load', ...)` を登録する（スタイルをオブジェクトで渡すと、`setStyle()` の中で同期的に発火することがある）。
- `{ diff: false }` を渡して、必ず作り直させる（差分が無いと `style.load` が発火せず、登録したリスナーが残って次の切り替えで二重に動く）。
- 足し直す前に `getSource()` / `getLayer()` / `hasImage()` で、すでにあるかを確かめる（同じ ID で足すと例外になる）。

あわせて次の点に気をつける。

- 自前のソース・レイヤー・画像の ID は、切り替え先のスタイルと重ならない名前にする（`app-` などの接頭辞を付ける）。同じ ID のソースやレイヤーが切り替え先にあると、有無の確認で足し直しが飛ばされる。画像は、`style.load` がスプライトの読み込みより先に発火するので、同じ ID の画像がスプライトにあると後から上書きされる。
- `setData()` でソースのデータを更新しているなら、最新のデータをアプリ側の変数に持っておき、足し直すときはそれを使う。
- URL を `setStyle()` に渡すと、取得に失敗したときには元のスタイルが消えた状態で `style.load` も発火しない。`error` イベントから失敗を見分けるのは確実ではない（`GeoloniaMap` はスタイル名を実際の URL に解決し、`transformRequest` でも URL が変わる）。取得の失敗を扱う必要がある場合は、スタイルの JSON を先に `fetch` して確かめ、取得できたときだけオブジェクトとして `setStyle()` に渡す。こうすると失敗しても `setStyle()` を呼ばないので、今の地図はそのまま残る。ただし style.json の中の相対 URL（スプライトやソース）は解決されなくなるので、この方法は中身が絶対 URL のスタイルに使う。

```js
let currentPoints = initialPoints; // setData() するときは、この変数も更新する

function restoreCustomLayers() {
  // ID は切り替え先のスタイルと重ならない名前にする
  if (!map.hasImage('app-pin')) map.addImage('app-pin', pinImage);
  if (!map.getSource('app-points')) map.addSource('app-points', { type: 'geojson', data: currentPoints });
  if (!map.getLayer('app-points')) {
    map.addLayer({ id: 'app-points', type: 'symbol', source: 'app-points', layout: { 'icon-image': 'app-pin' } });
  }
}

map.on('load', restoreCustomLayers); // 最初の読み込み

async function switchStyle(nextStyleUrl) {
  // 先に取得して確かめる。失敗したら setStyle() を呼ばないので、今の地図はそのまま残る
  const res = await fetch(nextStyleUrl);
  if (!res.ok) throw new Error(`スタイルを取得できません（${res.status}）`);
  const style = await res.json();
  if (style.version !== 8 || !Array.isArray(style.layers)) throw new Error('スタイルの形式が正しくありません');

  map.once('style.load', restoreCustomLayers); // setStyle の前に登録する
  map.setStyle(style, { diff: false });
}
```

## script タグで読み込んでいる場合

`<script src="https://api.mapbox.com/mapbox-gl-js/...">` で読み込んでいるページは、CDN の `embed/v5` に置き換える。MapLibre GL JS のクラスがグローバル変数 `geolonia` から `geolonia.Map` / `geolonia.Marker` / `geolonia.Popup` のように使える。

- embed は同じものを `window.maplibregl` と `window.mapboxgl` にも入れるので、`mapboxgl.Map` と書いたままでも動く。ただし移行後のコードでは `geolonia.*` に書き換えておく。
- `geolonia.Map` と `geolonia.Marker` は Geolonia の拡張クラスで、マーカーは Geolonia の既定の見た目になる（MapLibre の素の `Marker` とは見た目が違う）。

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
