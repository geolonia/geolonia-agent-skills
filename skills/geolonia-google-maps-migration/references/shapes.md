# 図形（Polyline / Polygon / Rectangle / Circle）の移行

4 クラスとも公式 API がある。Google Maps のコードは**ほぼそのまま移植できる**。
「自前で `addSource`/`addLayer` して線を引く」回避策は新規コードには不要
（[`known-gaps.md`](known-gaps.md) の「公式 API があるもの」）。

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

| クラス | 主なオプション | 主なメソッド |
| ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Polyline` | `path` / `strokeColor` / `strokeOpacity` / `strokeWeight` / `visible` / `zIndex` / `map` | `getPath` / `setPath` / `getVisible` / `setVisible` / `getZIndex` / `setZIndex` / `setOptions` / `setMap` |
| `Polygon` | `paths` + 上記 + `fillColor` / `fillOpacity` | `getPath` / `getPaths` / `setPath` / `setPaths` / 他は同じ |
| `Rectangle` | `bounds` + stroke/fill 系 | `getBounds` / `setBounds` / 他は同じ |
| `Circle` | `center` / `radius`（メートル）+ stroke/fill 系 | `getCenter` / `setCenter` / `getRadius` / `setRadius` / `getBounds` / 他は同じ |

座標は Google Maps と同じ `{ lat, lng }` literal（または `LatLng` インスタンス）。
`Polygon` の `paths` に配列の配列を渡すと、最初のリングが外周、以降が穴になる
（Google Maps と同じ）。

## 地図の準備を待つ必要は無い

`setMap()` は内部で地図の初期化完了を待ってから MapLibre のソースとレイヤーを足す。
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

## クリックイベント

Google Maps と同じく `addListener("click", handler)` で受け取れる。リスナーに渡る
イベントは、クリック位置の `latLng`（`LatLng` インスタンス）と元の DOM イベントの
`domEvent` を持つ。

```js
const area = new geolonia.maps.Polygon({ paths, map, fillColor: '#2f6fed' });
area.addListener('click', (e) => {
  console.log(e.latLng.lat(), e.latLng.lng(), e.domEvent.shiftKey);
});
```

図形の上をクリックしたときは、地図（`map`）の `click` は発火しない。地図の `click` で
「何も無い場所のクリック」を処理しているコードは、そのまま移植できる。

`clickable` オプションは無く、図形は常にクリックを受け付ける。

## 重なり順（`zIndex`）

`zIndex` が大きい図形ほど手前に描かれる。既定は `0` で、同じ値の図形は地図に追加した順に
重なる。後から変えるときは `setZIndex()` か `setOptions({ zIndex })`。

```js
new geolonia.maps.Polygon({ paths: base, map, zIndex: 1 });
new geolonia.maps.Polygon({ paths: highlight, map, zIndex: 10 }); // 常に base の上
```

図形の `zIndex` は maps-suite の図形どうしの重なり順で、マーカー（DOM 要素）は常に図形より
手前に出る。0 以外の `zIndex` を一度でも使うと、図形のレイヤーは地図の最前面へ並べ直される
ため、`map.getGeoloniaMap()` で自前に足したレイヤーより上に描かれる。

## 数が多い場合の注意

図形 1 インスタンスにつき MapLibre のソースが 1 つと、レイヤーが 1 つ（`Polyline`）
または 2 つ（`Polygon` / `Rectangle` / `Circle` は塗りと外周線）作られる。数百件を超える
線や面を描く場合は、1 つの GeoJSON ソースにまとめて上記の自前レイヤー方式にした方が軽い。
少数の図形なら公式クラスで書く方が読みやすく、移行の差分も小さい。
