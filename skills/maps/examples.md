# コード例

## 基本: 地図を表示する

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Geolonia Map</title>
</head>
<body>
  <div class="geolonia"
    data-lat="35.6812"
    data-lng="139.7671"
    data-zoom="14"
    style="width: 100%; height: 400px;">
  </div>
  <script type="text/javascript" src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>
</body>
</html>
```

## 複数マーカーを GeoJSON で表示

```html
<div id="map" class="geolonia"
  data-geojson="./markers.geojson"
  data-cluster="on"
  data-cluster-color="#FF6600"
  data-marker="off"
  style="width: 100%; height: 500px;">
</div>
```

markers.geojson:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [139.7671, 35.6812] },
      "properties": { "title": "東京駅", "description": "東京都千代田区" }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [135.5023, 34.6937] },
      "properties": { "title": "大阪駅", "description": "大阪府大阪市" }
    }
  ]
}
```

## JavaScript でマーカーとポップアップを追加

```html
<div id="map" style="width: 100%; height: 500px;"></div>
<script type="text/javascript" src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>
<script>
  const map = new geolonia.Map({
    container: 'map',
    style: 'geolonia/basic-v2',
    center: [139.7671, 35.6812],
    zoom: 12
  });

  const locations = [
    { lngLat: [139.7671, 35.6812], title: '東京駅' },
    { lngLat: [139.7454, 35.6586], title: '渋谷駅' },
    { lngLat: [139.7006, 35.6902], title: '新宿駅' }
  ];

  locations.forEach(loc => {
    const popup = new geolonia.Popup({ offset: 25 })
      .setHTML(`<h3>${loc.title}</h3>`);

    new geolonia.Marker()
      .setLngLat(loc.lngLat)
      .setPopup(popup)
      .addTo(map);
  });
</script>
```

## 3D ビル表示

```html
<div class="geolonia"
  data-lat="35.6812"
  data-lng="139.7671"
  data-zoom="16"
  data-pitch="45"
  data-3d="on"
  style="width: 100%; height: 500px;">
</div>
```

## 住所検索付き地図

```html
<div style="margin-bottom: 8px;">
  <input type="text" id="address" placeholder="住所を入力" style="width: 300px; padding: 4px;">
  <button id="search">検索</button>
</div>
<div id="map" style="width: 100%; height: 500px;"></div>

<script type="text/javascript" src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>
<script src="https://cdn.geolonia.com/community-geocoder.js"></script>
<script>
  const map = new geolonia.Map({
    container: 'map',
    style: 'geolonia/basic-v2',
    center: [139.7671, 35.6812],
    zoom: 12
  });

  let currentMarker = null;

  document.getElementById('search').addEventListener('click', () => {
    const address = document.getElementById('address').value;
    if (!address) return;

    getLatLng(address, (result) => {
      const lngLat = [result.lng, result.lat];

      map.flyTo({ center: lngLat, zoom: 16 });

      if (currentMarker) currentMarker.remove();

      currentMarker = new geolonia.Marker()
        .setLngLat(lngLat)
        .setPopup(
          new geolonia.Popup().setHTML(
            `<p>${result.pref}${result.city}${result.town}${result.addr}</p>`
          )
        )
        .addTo(map)
        .togglePopup();
    }, (error) => {
      alert('住所が見つかりませんでした');
    });
  });
</script>
```

## クリック位置の逆ジオコーディング

```html
<div id="map" style="width: 100%; height: 500px;"></div>
<div id="result"></div>

<script type="text/javascript" src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>
<script src="https://cdn.jsdelivr.net/npm/@geolonia/open-reverse-geocoder@latest/dist/index.js"></script>
<script>
  const map = new geolonia.Map({
    container: 'map',
    style: 'geolonia/basic-v2',
    center: [139.7671, 35.6812],
    zoom: 10
  });

  map.on('click', async (e) => {
    const { lng, lat } = e.lngLat;
    const result = await openReverseGeocoder([lng, lat]);
    document.getElementById('result').textContent =
      `${result.prefecture}${result.city} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  });
</script>
```

## GeoJSON レイヤーの動的追加

```javascript
const map = new geolonia.Map({
  container: 'map',
  style: 'geolonia/basic-v2',
  center: [139.7671, 35.6812],
  zoom: 10
});

map.on('load', () => {
  // SimpleStyle で簡単に追加
  fetch('./areas.geojson')
    .then(res => res.json())
    .then(geojson => {
      new geolonia.SimpleStyle(geojson)
        .addTo(map)
        .fitBounds();
    });
});
```

## GSI スタイルで日本地図を表示

```html
<div class="geolonia"
  data-style="geolonia/gsi"
  data-lat="36.0"
  data-lng="138.0"
  data-zoom="5"
  style="width: 100%; height: 500px;">
</div>
```
