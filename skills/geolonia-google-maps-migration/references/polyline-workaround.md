# Polyline / Polygon の代替実装

`@geolonia/maps-suite` に `Polyline`/`Polygon` 相当のクラスは無い（詳細は
[`known-gaps.md`](known-gaps.md)）。`map._getImpl()` で内部の MapLibre GL JS インスタンス
を取得し、GeoJSON の `line`/`fill` レイヤーとして描画する。

## Before（Google Maps）

```js
new google.maps.Polyline({
  path: [{ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }],
  map,
  strokeColor: '#2f6fed',
  strokeOpacity: 0.8,
  strokeWeight: 3,
});
```

## After（@geolonia/maps-suite）

線の色を Feature ごとに変えられるよう、また地図の準備が整う前に更新関数が呼ばれても
内容を失わないよう、経路データは常に `pendingPaths` に保持してから同期する。

```js
let pendingPaths = []; // 直近の syncLines() 呼び出し内容を常に保持する
let sourceReady = false;

function toLinesGeoJSON(paths) {
  return {
    type: 'FeatureCollection',
    // 各 path は { points: [{lat, lng}, ...], color } の形。
    // addLayer() 側が line-color: ['get', 'color'] を参照するため、
    // Feature の properties.color を必ず引き回す。
    features: paths.map(({ points, color }) => ({
      type: 'Feature',
      properties: { color },
      geometry: {
        type: 'LineString',
        // MapLibre 側は [lng, lat] の順序（{lat,lng} literal ではない）
        coordinates: points.map((p) => [p.lng, p.lat]),
      },
    })),
  };
}

// 地図の読み込みが完了するまで（'idle' イベントで判定）addSource()/addLayer() は呼べない
// （スタイル読み込み前に呼ぶと失敗する）。ここで初めて pendingPaths を反映する。
geolonia.maps.event.addListenerOnce(map, 'idle', () => {
  const impl = map._getImpl();
  impl.addSource('my-lines', { type: 'geojson', data: toLinesGeoJSON(pendingPaths) });
  impl.addLayer({
    id: 'my-lines-layer',
    type: 'line',
    source: 'my-lines',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-opacity': 0.8,
      'line-width': 3,
    },
  });
  sourceReady = true;
});

// 線の追加・削除・経路変更はすべてこの関数から行う。
// addLayer/removeLayer の繰り返しは再描画のたびにチラつくため、
// 既存のソースへの setData() でまとめて更新する。
function syncLines(map, paths) {
  pendingPaths = paths; // 準備前に呼ばれても最新の状態を保持しておく
  if (!sourceReady) return; // 'idle' 後の addSource 呼び出し時に pendingPaths が反映される

  const impl = map._getImpl();
  impl.getSource('my-lines').setData(toLinesGeoJSON(paths));
}
```

`geolonia.maps.event.addListenerOnce(map, "idle", handler)` は `Map` の公開 API
（`MVCObject.addListener` 経由）なので、`map._getImpl()` を使う前の「地図の準備待ち」自体は
プライベート API に依存せずに書ける。

線を「消す」場合は `paths` から該当データを除いた状態で `syncLines()` を呼べばよい
（`removeLayer`/`removeSource` を都度呼ぶ必要はない）。

## Polygon（面）も同じ考え方

`type: 'line'` の代わりに `type: 'fill'` レイヤーを使い、`geometry.type` を `'Polygon'`
（座標は `[[[lng, lat], ...]]` の三重配列、リングを閉じる）にすれば同様に代替できる。
