# 図形（Polyline / Polygon / Rectangle / Circle）の移行

v1.1.0 で 4 クラスとも実装された。Google Maps のコードは**ほぼそのまま移植できる**。
v1.0.1 向けに書かれた「`map._getImpl()` + `addSource`/`addLayer` で線を引く」回避策は、
もう新規コードには不要（[`known-gaps.md`](known-gaps.md) の「v1.1.0 で解消されたギャップ」）。

## そのまま移植できるもの

```js
// Before（Google Maps）
new google.maps.Polyline({
  path: [
    { lat: 35.68, lng: 139.76 },
    { lat: 35.69, lng: 139.77 },
  ],
  map,
  strokeColor: '#2f6fed',
  strokeOpacity: 0.8,
  strokeWeight: 3,
});

// After（@geolonia/maps-suite）: クラス名を差し替えるだけ
new geolonia.maps.Polyline({
  path: [
    { lat: 35.68, lng: 139.76 },
    { lat: 35.69, lng: 139.77 },
  ],
  map,
  strokeColor: '#2f6fed',
  strokeOpacity: 0.8,
  strokeWeight: 3,
});
```

| クラス      | 主なオプション                                                                | 主なメソッド                                                                  |
| ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Polyline`  | `path` / `strokeColor` / `strokeOpacity` / `strokeWeight` / `visible` / `map` | `getPath` / `setPath` / `getVisible` / `setVisible` / `setOptions` / `setMap`    |
| `Polygon`   | `paths` + 上記 + `fillColor` / `fillOpacity`                                  | `getPath` / `getPaths` / `setPath` / `setPaths` / 他は同じ                       |
| `Rectangle` | `bounds` + stroke/fill 系                                                     | `getBounds` / `setBounds` / 他は同じ                                             |
| `Circle`    | `center` / `radius`（メートル）+ stroke/fill 系                               | `getCenter` / `setCenter` / `getRadius` / `setRadius` / `getBounds` / 他は同じ   |

座標は Google Maps と同じ `{ lat, lng }` literal（または `LatLng` インスタンス）。
`Polygon` の `paths` に配列の配列を渡すと、最初のリングが外周、以降が穴になる
（Google Maps と同じ）。

## 地図の準備を待つ必要は無い

`setMap()` は内部で `map._whenReady()` を待ってから MapLibre のソースとレイヤーを足す。
`idle` イベントを待ってから図形を作る、といった小細工は不要で、地図の生成直後に
`new geolonia.maps.Polyline({ map, ... })` を呼んでよい。

## パスを動的に更新する

`getPath()` は `MVCArray<LatLng>` を返す。`MVCArray` を直接変更すると図形が自動で再描画される
（`insert_at` / `remove_at` / `set_at` を購読しているため）。

```js
const line = new geolonia.maps.Polyline({ path: [], map });

// どちらでも再描画される
line.getPath().push(new geolonia.maps.LatLng(35.69, 139.77)); // MVCArray を変異させる
line.setPath(newPoints); // まるごと差し替える
```

削除は Google Maps と同じく `shape.setMap(null)`。内部のソースとレイヤーも一緒に片付く。

## クリックイベントが必要な場合

図形クラスは `click` を発火しない（[`known-gaps.md`](known-gaps.md) の残ギャップ 1）。
図形自体をクリック対象にしたい場合は、その図形だけ `map._getImpl()` を使って自前の
レイヤーとして描き、レイヤー ID を自分で持ってクリックを取る。

```js
geolonia.maps.event.addListenerOnce(map, 'idle', () => {
  const impl = map._getImpl();
  impl.addSource('clickable-areas', { type: 'geojson', data: toGeoJSON(areas) });
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

`geolonia.maps.event.addListenerOnce(map, "idle", handler)` は公開 API（`MVCObject` 経由）
なので、「地図の準備待ち」自体はプライベート API に依存せずに書ける。
`map._getImpl()` に渡す座標は MapLibre の作法通り `[lng, lat]` の配列（`{lat, lng}` literal
ではない）である点に注意。

## 数が多い場合の注意

図形 1 インスタンスにつき MapLibre のソースが 1 つと、レイヤーが 1 つ（`Polyline`）
または 2 つ（`Polygon` / `Rectangle` / `Circle` は塗りと外周線）作られる。数百件を超える
線や面を描く場合は、1 つの GeoJSON ソースにまとめて上記の自前レイヤー方式にした方が軽い。
少数の図形なら公式クラスで書く方が読みやすく、移行の差分も小さい。
