# Google Maps と @geolonia/maps-suite の細かい API の違い

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
// OverlayView / LatLng / LatLngBounds / MVCObject / event / importLibrary が使える
```

`geolonia.maps.importLibrary(name)` という非同期ローダーもあるが、返す内容はライブラリ名ごとに
以下の固定セットのみ：

| 名前       | 返すもの                                             |
| ---------- | ----------------------------------------------------- |
| `"maps"`   | `Map`, `MapElement`, `OverlayView`                     |
| `"marker"` | `Marker`, `AdvancedMarkerElement`, `MarkerClusterer`   |
| `"core"`   | `LatLng`, `LatLngBounds`, `MVCObject`, `event`         |

**`InfoWindow` はどのライブラリ名でも返らない。** `geolonia.maps.InfoWindow` を直接参照する
必要がある。`importLibrary()` の返り値だけで完結させようとすると `InfoWindow` が抜け落ちて
ハマる。このスキルでは `importLibrary()` を使わず `geolonia.maps.*` を直接参照する方式を
推奨している（Map/Marker/InfoWindow/MarkerClusterer をすべて同じ書き方で扱える）。

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

`MapOptions` は `center` / `zoom` / `style` / `apiKey` のみ。Google Maps の
`gestureHandling` / `fullscreenControl` / `streetViewControl` / `mapTypeId` は型に存在しない
ため、TypeScript ではコンパイルエラーになる（削除が必要）。JavaScript から渡した場合に実際
どう扱われるか（単に無視される等）はバージョン依存で保証されないため、いずれにせよ削除すること。

## `InfoWindow.open()` の引数

```js
// Google Maps: オプションオブジェクト
infoWindow.open({ map, anchor: marker });

// maps-suite: 位置引数
infoWindow.open(map, marker);
```

`infoWindow.close()` は同じ。`addListener('closeclick', handler)` も同じ。

## `Marker`

`position` / `map` / `title` / `icon` はほぼ同じ形（`icon` は `{ url }` のみ、
[`marker-icons.md`](marker-icons.md) 参照）。`getPosition()` は `LatLng` インスタンス
（`.lat()`/`.lng()` メソッド）を返す点は Google Maps と同じ。`setPosition()` は
`{lat, lng}` literal と `LatLng` インスタンスの両方を受け付ける。

## `MarkerClusterer`

`new geolonia.maps.MarkerClusterer({ map, markers })` / `addMarker(s)` /
`removeMarker(s)` / `clearMarkers()` はほぼ同じ形。ただし、マーカーの表示/非表示の再計算は
地図の `idle`/`moveend` イベントで行われるため、`addMarkers()` を呼んだ直後ではなく
次の `idle` を待つ必要がある（テストで「マーカーがまだクラスタ化されていない」ように
見える場合はこれが原因）。

## 座標の形式

Google Maps と同じく `{ lat, lng }` の literal を使う（Mapbox/MapLibre のような
`[lng, lat]` 配列ではない）。ただし `map._getImpl()` で取得した生の MapLibre インスタンスに
直接触る場合（`Polyline` の代替実装など）は MapLibre の作法通り `[lng, lat]` の配列を使う
必要があるので混同しないこと。

## イベント

`map.addListener("click", handler)` / `marker.addListener("click", handler)` は
Google Maps と同じ書き方で動く（`MVCObject.addListener` がベース）。`click` イベントの
`e.latLng` は `LatLng` インスタンス（`.lat()`/`.lng()`）。
