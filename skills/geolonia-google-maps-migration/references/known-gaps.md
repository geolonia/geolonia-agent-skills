# 既知のギャップ（@geolonia/maps-suite v1.2.2 時点）

**この一覧はインストール済みの版より古いことがある。** 「無い」と書かれている機能を
回避策で書く前に、必ず `node_modules/@geolonia/maps-suite/dist/npm/index.d.ts` を
その名前で検索して、公式 API が無いことを確かめる。型定義が正で、この一覧は目安。

版を固定する理由が無いかぎり最新版を使う。互換の範囲はリリースごとに広がるため、
古い版に留まると不要な回避策を書くことになる。

## 公式 API があるもの（回避策を書かない）

次はすべて公式 API で書ける。自前レイヤーを描く、SVG data URI で丸マーカーを作る、
`easeTo` に手でまとめる、といった回避策を新規コードに書かないこと。

| 用途                          | 使う API                                                            |
| ----------------------------- | ------------------------------------------------------------------- |
| 折れ線                        | `geolonia.maps.Polyline`                                              |
| 多角形                        | `geolonia.maps.Polygon`（穴あきポリゴン対応）                         |
| 矩形                          | `geolonia.maps.Rectangle`                                             |
| 円                            | `geolonia.maps.Circle`（`radius` はメートル）                         |
| ベクター記号アイコン          | `icon: { path: SymbolPath.CIRCLE, ... }`                              |
| 座標・サイズの値              | `geolonia.maps.Point` / `geolonia.maps.Size`（immutable）             |
| カメラ操作                    | `moveCamera()` / `setHeading()` / `setTilt()` / `disableDefaultUI`    |
| パンとズームの同時指定        | `panTo()` + `setZoom()` を同期的に続けて呼ぶ（下記）                  |
| GeoJSON レイヤー              | `map.data`（`addGeoJson` / `setStyle` / `toGeoJson`。下記）           |
| 土台の `GeoloniaMap`          | `map.getGeoloniaMap()`                                                |
| 土台の MapLibre `Marker`      | `marker.getMapLibreMarker()`                                          |
| 初期化の完了待ち              | `map.whenReady()`                                                     |

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
個別のフィーチャは `add` / `remove` / `getFeatureById` / `forEach` で扱い、
`toGeoJson(callback)` で書き出す。

図形クラスと同じく、`Data` のフィーチャも `click` を発火しない。

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

### 1. 図形クラス（Polyline / Polygon / Rectangle / Circle）にクリックイベントが無い

`polygon.addListener("click", handler)` は Google Maps では動くが、maps-suite の図形クラスは
`click` を発火しない（`MVCObject` 由来のプロパティ変更通知は届く）。図形が持つ MapLibre の
レイヤー ID は private なので、公開 API からクリック判定を付ける手段が無い。

→ クリック可能な図形が必要な場合の実装例: [`shapes.md`](shapes.md#クリックイベントが必要な場合)

### 2. 図形・マーカーのオプションが最小セットしかない

| クラス                                  | 使えるオプション                                                          | 未対応                                                     |
| --------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `Polyline`                              | `path` / `map` / `strokeColor` / `strokeOpacity` / `strokeWeight` / `visible` | `icons`（矢印等）/ `geodesic` / `zIndex` / `editable` / `draggable` / `clickable` |
| `Polygon` / `Rectangle` / `Circle`      | 上記 + `fillColor` / `fillOpacity`（`Polygon` は `paths`、`Rectangle` は `bounds`、`Circle` は `center`/`radius`） | 同上                                                       |
| `Marker`                                | `position` / `map` / `title` / `icon`                                       | `draggable` / `label` / `zIndex` / `animation` / `opacity` / `anchorPoint` |
| `InfoWindow`                            | `content`                                                                   | `maxWidth` / `pixelOffset` / `position`（`open()` は位置引数のみ） |

編集可能な図形（`editable: true` で頂点をドラッグ）は maps-suite の範囲外。
`map.getGeoloniaMap()` で取得した MapLibre インスタンスに描画プラグインを組み合わせる。

### 3. `MapOptions` に無いフィールド

使えるのは `center` / `zoom` / `tilt` / `heading` / `style` / `apiKey` / `threeDimensional` /
`disableDefaultUI` のみ。Google Maps の `gestureHandling` / `mapTypeId` / `minZoom` /
`maxZoom` / `restriction` / コントロール個別指定（`zoomControl` 等）は型に存在しない。
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
