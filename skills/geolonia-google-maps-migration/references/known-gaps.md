# 既知のギャップ（@geolonia/maps-suite v1.1.0 時点）

`@geolonia/maps-suite` 側で対処されるまでは、ここに書く回避策を使う。新しいバージョンが
リリースされたら、対象バージョンの型定義と実装を確認してこのリファレンスを更新すること。

## v1.1.0 で解消されたギャップ

v1.0.1 時点で回避策が必須だった以下は、**v1.1.0 では公式 API がある**。古い回避策
（`_getImpl()` + `addSource`/`addLayer` で線を引く、SVG data URI で丸マーカーを作る、
`easeTo` に手でまとめる）を新規コードに書かないこと。

| 内容 | 状態 | 対応する API |
| --------------------------------------------- | ----------------------- | -------------------------------------------------------- |
| `Polyline` が無い | v1.1.0 で追加 | `geolonia.maps.Polyline` |
| `Polygon` が無い | v1.1.0 で追加 | `geolonia.maps.Polygon`（穴あきポリゴン対応） |
| `Rectangle` が無い | v1.1.0 で追加 | `geolonia.maps.Rectangle` |
| `Circle` が無い | v1.1.0 で追加 | `geolonia.maps.Circle`（`radius` はメートル） |
| ベクター記号アイコンが無い | v1.1.0 で追加 | `icon: { path: SymbolPath.CIRCLE, ... }` |
| `panTo()` + `setZoom()` が壊れる | v1.1.0 で修正 | 同一マイクロタスク内の変更は 1 回の `easeTo`/`jumpTo` に集約される |
| `importLibrary("maps")` が `InfoWindow` を返さない | v1.1.0 で修正 | `importLibrary("maps")` が図形クラスと `InfoWindow` を含む |
| `Point` / `Size` が無い | v1.1.0 で追加 | `geolonia.maps.Point` / `geolonia.maps.Size`（immutable） |
| カメラ操作 API の不足 | v1.1.0 で追加 | `moveCamera()` / `setHeading()` / `setTilt()` / `disableDefaultUI` |

### `panTo()` + `setZoom()` が直った仕組み（と残る注意点）

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

| クラス | 使えるオプション | 未対応 |
| --------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `Polyline` | `path` / `map` / `strokeColor` / `strokeOpacity` / `strokeWeight` / `visible` | `icons`（矢印等）/ `geodesic` / `zIndex` / `editable` / `draggable` / `clickable` |
| `Polygon` / `Rectangle` / `Circle` | 上記 + `fillColor` / `fillOpacity`（`Polygon` は `paths`、`Rectangle` は `bounds`、`Circle` は `center`/`radius`） | 同上 |
| `Marker` | `position` / `map` / `title` / `icon` | `draggable` / `label` / `zIndex` / `animation` / `opacity` / `anchorPoint` |
| `InfoWindow` | `content` | `maxWidth` / `pixelOffset` / `position`（`open()` は位置引数のみ） |

編集可能な図形（`editable: true` で頂点をドラッグ）は maps-suite の範囲外。
`map._getImpl()` で取得した MapLibre インスタンスに描画プラグインを組み合わせる。

### 3. `MapOptions` に無いフィールド

使えるのは `center` / `zoom` / `tilt` / `heading` / `style` / `apiKey` / `threeDimensional` /
`disableDefaultUI` のみ。Google Maps の `gestureHandling` / `mapTypeId` / `minZoom` /
`maxZoom` / `restriction` / コントロール個別指定（`zoomControl` 等）は型に存在しない。
既定 UI は `disableDefaultUI: true` による一括非表示のみで、個別の出し分けはできない
（必要なら `map._getImpl()` に対して MapLibre のコントロールを自前で足す）。

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
