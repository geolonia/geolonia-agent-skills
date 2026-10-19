# 既知のギャップ（@geolonia/maps-suite v2.1.0 時点）

**この一覧はインストール済みの版より古いことがある。** 「無い」と書かれている機能を
回避策で書く前に、必ず `node_modules/@geolonia/maps-suite/dist/npm/index.d.ts` を
その名前で検索して、公式 API が無いことを確かめる。型定義が正で、この一覧は目安。

版を固定する理由が無いかぎり最新版を使う。互換の範囲はリリースごとに広がるため、
古い版に留まると不要な回避策を書くことになる。

## 公式 API があるもの（回避策を書かない）

次の用途はすべて公式 API で書ける。**これらの用途については**、自前レイヤーを描く、
SVG data URI で単純な記号を作る、`easeTo` に手でまとめる、といった回避策を新規コードに
書かないこと。

公式 API で足りない用途（`map.data` のフィーチャのクリック判定、編集可能な図形、
`Symbol` で表現できないアイコン、既定 UI の個別出し分けなど）は下の「残っているギャップ」を
参照する。そこでは
自前レイヤーや data URI が引き続き正しい手段になる。

| 用途 | 使う API |
| ----------------------------- | ------------------------------------------------------------------- |
| 折れ線 | `geolonia.maps.Polyline` |
| 多角形 | `geolonia.maps.Polygon`（穴あきポリゴン対応） |
| 矩形 | `geolonia.maps.Rectangle` |
| 円 | `geolonia.maps.Circle`（`radius` はメートル） |
| 図形のクリック | `shape.addListener("click", (e) => ...)`（`e.latLng` / `e.domEvent`） |
| 図形・マーカーの重なり順 | `zIndex` オプション / `setZIndex()` |
| マーカーのラベル | `label` オプション / `setLabel()`（文字列または `MarkerLabel`） |
| ベクター記号アイコン | `icon: { path: SymbolPath.CIRCLE, ... }` |
| 座標・サイズの値 | `geolonia.maps.Point` / `geolonia.maps.Size`（immutable） |
| カメラ操作 | `moveCamera()` / `setHeading()` / `setTilt()` / `disableDefaultUI` |
| ジェスチャー・ズーム範囲 | `MapOptions` の `gestureHandling` / `minZoom` / `maxZoom` |
| `InfoWindow` を開く | `open({ map, anchor })` と `open(map, anchor)` のどちらでもよい |
| パンとズームの同時指定 | `panTo()` + `setZoom()` を同期的に続けて呼ぶ（下記） |
| GeoJSON レイヤー | `map.data`（`addGeoJson` / `setStyle` / `toGeoJson`。下記） |
| 土台の `GeoloniaMap` | `map.getGeoloniaMap()` |
| 土台の MapLibre `Marker` | `marker.getMapLibreMarker()` |
| 初期化の完了待ち | `map.whenReady()` |

`importLibrary("maps")` は `Map` / `MapElement` / `OverlayView` / `Polyline` / `Polygon` /
`Rectangle` / `Circle` / `InfoWindow` / `Data` を返す。

`_getImpl()` と `_whenReady()` は内部用として残っているが、公開 API があるので新規コードには
書かない。なお `getGeoloniaMap()` 経由で center / zoom / tilt / heading を直接変更した場合の
動作は保証されない。カメラ操作は maps-suite 側の API を使う。

### GeoJSON（`map.data`）

`google.maps.Data` に相当する。`map.data` は最初の参照時に作られる。

```js
map.data.addGeoJson(featureCollection);
map.data.setStyle({ fillColor: "#ff0000", strokeWeight: 2 });
```

`setStyle` にはフィーチャを受け取る関数も渡せる。指定できるのは `fillColor` /
`fillOpacity` / `strokeColor` / `strokeOpacity` / `strokeWeight` / `visible`。
個別のフィーチャは `add` / `remove` / `getFeatureById` / `forEach` で扱う。これらが返す
フィーチャは `geolonia.maps.DataFeature` のインスタンスで、`setStyle` に関数を渡した
場合もこの型が引数に来る（`getGeometry` / `getProperty` / `setProperty` / `getId` など）。
書き出しは `toGeoJson(callback)`。

図形クラスと違い、`Data` のフィーチャは `click` を発火しない（下の「残っているギャップ」）。

### `panTo()` + `setZoom()` の仕組み（と注意点）

`Map` は `setCenter`/`panTo`/`setZoom`/`setTilt`/`setHeading`/`moveCamera` の呼び出しを
いったん内部バッファに溜め、マイクロタスクで 1 回だけ MapLibre に反映する
（2 つ以上変わっていれば `easeTo()`/`jumpTo()` にまとめ、1 つだけなら従来通り個別に呼ぶ）。
そのため Google Maps と同じ書き方が動く。

```js
map.panTo({ lat, lng });
map.setZoom(15); // 同期的に続けて呼べば 1 回の easeTo({ center, zoom }) になる
```

ただし**まとまるのは「同じ同期処理の中で呼んだ場合」だけ**。`await` や `setTimeout` を
挟んで別タスクから `setZoom()` を呼ぶと、進行中の `panTo()` アニメーションを
MapLibre 側が中断するため、途中まで動いた位置でズームされる。パンとズームを続けて
行いたい場合は同じ関数の中で連続して呼ぶか、`moveCamera({ center, zoom })` を使う
（`moveCamera` はアニメーション無しの即時反映）。

## 残っているギャップ

### 1. `map.data` のフィーチャにクリックイベントが無い

`map.data.addListener("click", handler)` は Google Maps では動くが、maps-suite の `Data` は
`click` を発火しない。クリック可能な GeoJSON が必要な場合は、`map.getGeoloniaMap()` で
自前のレイヤーとして描き、レイヤー ID を自分で持ってクリックを取る。

```js
map.whenReady().then(() => {
  const impl = map.getGeoloniaMap();
  impl.addSource('clickable-areas', { type: 'geojson', data: featureCollection });
  impl.addLayer({
    id: 'clickable-areas-fill',
    type: 'fill',
    source: 'clickable-areas',
    // Feature ごとに色を変える場合は properties を参照する
    paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.4 },
  });
  impl.on('click', 'clickable-areas-fill', (e) => {
    console.log(e.features[0].properties);
  });
});
```

準備待ちには `map.whenReady()` を使う。`event.addListenerOnce(map, "idle", handler)` は
**登録より後に起きる `idle` しか拾わない**ため、すでに読み込みが終わっている地図に対して
呼ぶと、`addSource()` も `addLayer()` もクリック登録も実行されない。

`map.getGeoloniaMap()` が返す MapLibre インスタンスに渡す座標は、MapLibre の作法通り
`[lng, lat]` の配列（`{lat, lng}` literal ではない）である点に注意。

図形クラス（`Polyline` / `Polygon` / `Rectangle` / `Circle`）は `click` を発火するので、
数が少なければ GeoJSON の各フィーチャを図形クラスで描く方法もある（[`shapes.md`](shapes.md)）。

### 2. 図形・マーカーのオプションで未対応のもの

| クラス | 使えるオプション | 未対応 |
| --------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `Polyline` | `path` / `map` / `strokeColor` / `strokeOpacity` / `strokeWeight` / `visible` / `zIndex` | `icons`（矢印等）/ `geodesic` / `editable` / `draggable` / `clickable` |
| `Polygon` / `Rectangle` / `Circle` | 上記 + `fillColor` / `fillOpacity`（`Polygon` は `paths`、`Rectangle` は `bounds`、`Circle` は `center`/`radius`） | 同上 |
| `Marker` | `position` / `map` / `title` / `icon` / `label` / `zIndex` | `draggable` / `animation` / `opacity` / `anchorPoint` |
| `InfoWindow` | `content` | `maxWidth` / `pixelOffset` / `position` |

図形は `clickable` を持たず、表示中は常にクリックを受け付ける（`visible: false` の間は
受け付けない）。表示中の図形の上をクリックしても地図の `click` は発火しないため、「図形の上でも地図のクリック処理を動かしたい」コードは、
図形の `click` リスナーから同じ処理を呼ぶ。

編集可能な図形（`editable: true` で頂点をドラッグ）は maps-suite の範囲外。
`map.getGeoloniaMap()` で取得した MapLibre インスタンスに描画プラグインを組み合わせる。

### 3. `MapOptions` に無いフィールド

使えるのは `center` / `zoom` / `tilt` / `heading` / `style` / `apiKey` / `threeDimensional` /
`disableDefaultUI` / `gestureHandling` / `minZoom` / `maxZoom` のみ。Google Maps の
`mapTypeId` / `restriction` / コントロール個別指定（`zoomControl` 等）は型に存在しない。
既定 UI は `disableDefaultUI: true` による一括非表示のみで、個別の出し分けはできない
（必要なら `map.getGeoloniaMap()` に対して MapLibre のコントロールを自前で足す）。

### 4. サービス系 API（Geocoder / Directions / Places）が未実装

`importLibrary("places")` / `("geometry")` / `("drawing")` / `("visualization")` は
名前としては認識されるが、`console.warn` を出して**空オブジェクトを返す**。
`const { PlacesService } = await importLibrary("places")` のように書くと `undefined` が
返ってきて、実行時に初めて壊れる。移行前の棚卸しで必ず洗い出すこと。

住所から座標を引く用途であれば、Geolonia の
[community-geocoder](https://github.com/geolonia/community-geocoder) や
[normalize-japanese-addresses](https://github.com/geolonia/normalize-japanese-addresses)
を別途組み合わせる（[`geolonia-map`](../../maps/SKILL.md) スキルの `geocoding.md` を参照）。

## デバッグ時の切り分け方

アプリのコードが悪いのか、ライブラリ側の挙動なのか判断がつかない場合は、
`node_modules/@geolonia/maps-suite/dist/maps-suite.js`（IIFE バンドル。グローバルは
`GeoloniaMapsSuite`）を単体の HTML から読み込む最小の再現ページを作り、アプリのコードを
介さずに再現するかどうかを先に確認する。アプリ側のロジックを疑って延々デバッグするより
早く原因を切り分けられる。
