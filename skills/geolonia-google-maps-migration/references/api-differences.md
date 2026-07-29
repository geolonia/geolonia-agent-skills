# Google Maps と @geolonia/maps-suite の細かい API の違い

対象バージョン: `@geolonia/maps-suite` v1.1.0。

見た目は「ほぼ同じ」だが、そのまま移植すると壊れる細部をまとめる。「存在しない機能」は
[`known-gaps.md`](known-gaps.md) を参照。

## モジュールの取得方法

```js
// Before（Google Maps）
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
setOptions({ key: API_KEY, v: 'weekly' });
const { Map } = await importLibrary('maps');
```

`@geolonia/maps-suite` の npm パッケージは名前付きエクスポートが `geolonia` ひとつだけ。

```js
// After（@geolonia/maps-suite）
import { geolonia } from '@geolonia/maps-suite';

// geolonia.maps.Map / Marker / InfoWindow / MarkerClusterer / AdvancedMarkerElement /
// Polyline / Polygon / Rectangle / Circle / OverlayView / LatLng / LatLngBounds /
// Point / Size / SymbolPath / MVCObject / MVCArray / event / importLibrary が使える
```

`geolonia.maps.importLibrary(name)` という非同期ローダーもある。v1.1.0 で返す内容が増え、
Google Maps の分類に近づいた。

| 名前                                                | 返すもの                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `"maps"`                                            | `Map`, `MapElement`, `OverlayView`, `Polyline`, `Polygon`, `Rectangle`, `Circle`, `InfoWindow` |
| `"marker"`                                          | `Marker`, `AdvancedMarkerElement`, `MarkerClusterer`                           |
| `"core"`                                            | `LatLng`, `LatLngBounds`, `Point`, `Size`, `MVCObject`, `event`                |
| `"places"` / `"geometry"` / `"drawing"` / `"visualization"` | **空オブジェクト**（`console.warn` を出すだけで実装は無い）           |

v1.0.1 で `InfoWindow` がどのライブラリ名でも返らなかった問題は解消済みで、
`importLibrary("maps")` から取れる。ただし `"places"` 等は空オブジェクトを返すため、
分割代入した変数が実行時に `undefined` になる点は変わらない。

## `Map` コンストラクタ

```js
// Before（Google Maps）
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat, lng },
  zoom,
});

// After（@geolonia/maps-suite）
const map = new geolonia.maps.Map(document.getElementById('map'), {
  center: { lat, lng },
  zoom,
  style: 'geolonia/gsi', // または 'geolonia/basic-v2' など
  apiKey: API_KEY,
});
```

第一引数は必ず `HTMLElement`。文字列 ID を渡すと例外になる。

`MapOptions` で使えるのは以下だけ。

| フィールド          | 既定値            | 備考                                                                     |
| ------------------- | ----------------- | ------------------------------------------------------------------------ |
| `center`            | `{ lat: 0, lng: 0 }` | 省略時は「全球」表示になる（v1.1.0 で既定値が変わった）               |
| `zoom`              | `0`               | 同上                                                                     |
| `tilt`              | `0`               | MapLibre の pitch にマッピングされる                                     |
| `heading`           | `0`               | MapLibre の bearing にマッピングされる                                   |
| `style`             | maps-core の既定  | Geolonia のスタイル識別子またはスタイル URL                              |
| `apiKey`            | なし              | `<script src="...?key=XXX">` からの自動取得にも対応                      |
| `threeDimensional`  | `true`            | **3D 建物が既定で有効**。切るなら `false` を明示する                     |
| `disableDefaultUI`  | `false`           | `true` で既定コントロール（ナビ・現在地・全画面・スケール・ロゴ）を一括非表示 |

Google Maps の `gestureHandling` / `mapTypeId` / `minZoom` / `maxZoom` / `restriction` /
コントロール個別指定（`zoomControl` など）は型に存在しないため、TypeScript ではコンパイル
エラーになる（削除が必要）。JavaScript から渡した場合の扱いは保証されないので、いずれにせよ
削除すること。既定コントロールの出し分けは `disableDefaultUI` による一括指定のみ。

移行時に見落としやすいのは**既定値の変化**。Google Maps では `center`/`zoom` は必須に近い
指定だったため実害が出にくいが、条件分岐で省略しているコードがあると v1.1.0 では
`zoom: 0` の全球表示に落ちる。3D 建物も既定 ON なので、平面表示を前提にした UI では
`threeDimensional: false` を明示する。

## カメラ操作

```js
map.setCenter({ lat, lng }); // 即時
map.panTo({ lat, lng }); // アニメーション
map.setZoom(15);
map.setTilt(45); // 度。MapLibre の pitch
map.setHeading(90); // 度（北から時計回り）。MapLibre の bearing
map.moveCamera({ center, zoom, tilt, heading }); // まとめて即時反映
```

同じ同期処理の中で複数呼ぶと 1 回の `easeTo()`/`jumpTo()` にまとめられる。つまり Google Maps
と同じ `panTo()` → `setZoom()` の書き方がそのまま動く（v1.0.1 では壊れていた。詳細は
[`known-gaps.md`](known-gaps.md)）。`await` や `setTimeout` を挟むとまとまらないので、
続けて動かしたいときは同じ関数内で連続して呼ぶか `moveCamera()` を使う。

## `InfoWindow.open()` の引数

```js
// Google Maps: オプションオブジェクト
infoWindow.open({ map, anchor: marker });

// maps-suite: 位置引数（v1.1.0 でも変わっていない）
infoWindow.open(map, marker);
```

`infoWindow.close()` は同じ。`addListener('closeclick', handler)` も同じ。
`InfoWindowOptions` は `content` のみで、`maxWidth` / `pixelOffset` / `position` は無い。

## `Marker`

`position` / `map` / `title` / `icon` が使える。`icon` は画像 URL（`{ url }`）に加えて
v1.1.0 からベクター記号（`{ path: SymbolPath.CIRCLE, scale, fillColor, ... }`）に対応した
（[`marker-icons.md`](marker-icons.md)）。`getPosition()` は `LatLng` インスタンス
（`.lat()`/`.lng()` メソッド）を返す点は Google Maps と同じ。`setPosition()` は
`{lat, lng}` literal と `LatLng` インスタンスの両方を受け付ける。

## `Polyline` / `Polygon` / `Rectangle` / `Circle`

v1.1.0 で追加された。クラス名を差し替えるだけでほぼ移植できるが、`click` イベントや
`editable` / `draggable` / `zIndex` は未対応（[`shapes.md`](shapes.md)）。

## `Point` / `Size`

v1.1.0 で追加。`new geolonia.maps.Point(x, y)` / `new geolonia.maps.Size(width, height)`。
**インスタンスは実行時に凍結される**（`Object.freeze`）ため、Google Maps のように
`point.x = 10` と後から書き換えるコードは silent に無視される（strict mode では例外）。
新しいインスタンスを作り直すこと。

## `MarkerClusterer`

`new geolonia.maps.MarkerClusterer({ map, markers })` / `addMarker(s)` /
`removeMarker(s)` / `clearMarkers()` はほぼ同じ形。ただし、マーカーの表示/非表示の再計算は
地図の `idle`/`moveend` イベントで行われるため、`addMarkers()` を呼んだ直後ではなく
次の `idle` を待つ必要がある（テストで「マーカーがまだクラスタ化されていない」ように
見える場合はこれが原因）。

## 座標の形式

Google Maps と同じく `{ lat, lng }` の literal を使う（Mapbox/MapLibre のような
`[lng, lat]` 配列ではない）。ただし `map._getImpl()` で取得した生の MapLibre インスタンスに
直接触る場合は MapLibre の作法通り `[lng, lat]` の配列を使う必要があるので混同しないこと。

## イベント

`map.addListener("click", handler)` / `marker.addListener("click", handler)` は
Google Maps と同じ書き方で動く（`MVCObject.addListener` がベース）。`click` イベントの
`e.latLng` は `LatLng` インスタンス（`.lat()`/`.lng()`）。図形クラスは `click` を発火しない。
