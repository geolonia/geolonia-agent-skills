# JavaScript API リファレンス

CDN スクリプト読み込み後、グローバル変数 `geolonia` が利用可能になる。
MapLibre GL JS の全クラスが `geolonia` 名前空間で提供される。

## Map

```javascript
const map = new geolonia.Map('#map');
```

コンストラクタの引数はセレクタ文字列、または MapLibre GL JS の `MapOptions` オブジェクト:

```javascript
const map = new geolonia.Map({
  container: 'map',
  style: 'geolonia/basic-v2',
  center: [139.7671, 35.6812],
  zoom: 14,
  pitch: 30,
  bearing: 0
});
```

`geolonia.Map` は `maplibregl.Map` の拡張クラスなので、全メソッド・イベント・プロパティが使える。
MapLibre GL JS のドキュメント: https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/

### 主要イベント

```javascript
map.on('load', () => { /* マップ読み込み完了 */ });
map.on('click', (e) => { console.log(e.lngLat); });
map.on('moveend', () => { console.log(map.getCenter()); });
map.on('zoomend', () => { console.log(map.getZoom()); });
```

### ブラウザサポート確認

```javascript
if (!geolonia.supported()) {
  alert('このブラウザは対応していません');
}
```

## Marker

```javascript
const marker = new geolonia.Marker({ color: '#FF0000' })
  .setLngLat([139.7671, 35.6812])
  .addTo(map);
```

カスタム HTML マーカー:

```javascript
const el = document.createElement('div');
el.className = 'custom-marker';
el.style.width = '30px';
el.style.height = '30px';
el.style.backgroundImage = 'url(marker.png)';
el.style.backgroundSize = 'cover';

new geolonia.Marker({ element: el })
  .setLngLat([139.7671, 35.6812])
  .addTo(map);
```

## Popup

```javascript
const popup = new geolonia.Popup({ offset: 25 })
  .setHTML('<h3>東京駅</h3><p>丸の内</p>');

// マーカーにポップアップを紐付け
marker.setPopup(popup);

// 地図上に直接ポップアップを表示
new geolonia.Popup()
  .setLngLat([139.7671, 35.6812])
  .setHTML('<p>ここ</p>')
  .addTo(map);
```

## SimpleStyle（GeoJSON 表示）

GeoJSON データを SimpleStyle 仕様で地図に表示する Geolonia 独自の機能:

```javascript
map.on('load', () => {
  fetch('./data.geojson')
    .then(res => res.json())
    .then(geojson => {
      new geolonia.SimpleStyle(geojson)
        .addTo(map)
        .fitBounds();
    });
});
```

SimpleStyle は GeoJSON の `properties` に設定されたスタイル属性（`marker-color`, `stroke`, `fill` など）を自動で反映する。

## NavigationControl / その他コントロール

```javascript
map.addControl(new geolonia.NavigationControl(), 'top-right');
map.addControl(new geolonia.GeolocateControl(), 'top-right');
map.addControl(new geolonia.ScaleControl(), 'bottom-left');
map.addControl(new geolonia.FullscreenControl(), 'top-right');
```

## ソース・レイヤー操作

MapLibre GL JS と同じ API でソースとレイヤーを操作:

```javascript
map.on('load', () => {
  map.addSource('points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [139.7671, 35.6812] },
          properties: { title: '東京駅' }
        }
      ]
    }
  });

  map.addLayer({
    id: 'points-layer',
    type: 'circle',
    source: 'points',
    paint: {
      'circle-radius': 8,
      'circle-color': '#FF0000'
    }
  });
});
```

## プラグイン

Embed API のプラグインシステム:

```javascript
const myPlugin = (map, target, atts) => {
  // map: MapLibre GL JS Map インスタンス
  // target: コンテナ DOM 要素
  // atts: data-* 属性のオブジェクト
  console.log('Map loaded at', map.getCenter());
};

window.geolonia.registerPlugin(myPlugin);
```

プラグインスクリプトは Embed API のスクリプトより後に読み込む:

```html
<script src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>
<script src="my-plugin.js"></script>
```
