# Polyline / Polygon の代替実装

`@geolonia/maps-suite` に `Polyline`/`Polygon` 相当のクラスは無い（詳細は
[`known-gaps.md`](known-gaps.md)）。`map._getImpl()` で内部の MapLibre GL JS インスタンス
を取得し、GeoJSON の `line`/`fill` レイヤーとして描画する。

## 静的な線を描画する（Before / After）

```js
// Before（Google Maps）
new google.maps.Polyline({
  path: [{ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }],
  map,
  strokeColor: '#2f6fed',
  strokeOpacity: 0.8,
  strokeWeight: 3,
});
```

```js
// After（@geolonia/maps-suite）
// map の 'load' 完了後（'idle' イベントで判定）に一度だけ addSource/addLayer する
geolonia.maps.event.addListenerOnce(map, 'idle', () => {
  const impl = map._getImpl();
  impl.addSource('my-lines', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { color: '#2f6fed' },
          geometry: {
            type: 'LineString',
            // MapLibre 側は [lng, lat] の順序（{lat,lng} literal ではない）
            coordinates: [[a.lng, a.lat], [b.lng, b.lat]],
          },
        },
      ],
    },
  });
  impl.addLayer({
    id: 'my-lines-layer',
    type: 'line',
    source: 'my-lines',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'], // Feature ごとに色を変える場合
      'line-opacity': 0.8,
      'line-width': 3,
    },
  });
});
```

`geolonia.maps.event.addListenerOnce(map, "idle", handler)` は `Map` の公開 API
（`MVCObject.addListener` 経由）なので `map._getImpl()` を使う前の「地図の準備待ち」自体は
プライベート API に依存せずに書ける。

## 動的に更新する（線の追加・削除・経路変更）

`addLayer`/`removeLayer` を繰り返すと再描画のたびにチラつくため、既存のソースに対して
`setData()` でまとめて更新する。

```js
function syncLines(map, paths) {
  const impl = map._getImpl();
  const source = impl.getSource('my-lines');
  if (!source) return;

  source.setData({
    type: 'FeatureCollection',
    features: paths.map((path) => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: path.map((p) => [p.lng, p.lat]),
      },
    })),
  });
}
```

線を「消す」場合は `paths` から該当データを除いた状態で `setData()` を呼べばよい
（`removeLayer`/`removeSource` を都度呼ぶ必要はない）。

## Polygon（面）も同じ考え方

`type: 'line'` の代わりに `type: 'fill'` レイヤーを使い、`geometry.type` を `'Polygon'`
（座標は `[[[lng, lat], ...]]` の三重配列、リングを閉じる）にすれば同様に代替できる。
