# ベクター記号アイコン（SymbolPath.CIRCLE 等）の代替実装

## Before（Google Maps）

```js
const marker = new google.maps.Marker({
  position: { lat, lng },
  map,
  icon: {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: '#1a73e8',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  },
});
```

## After（@geolonia/maps-suite）

`MarkerOptions.icon` は `{ url: string }`（画像 URL）のみ対応（詳細は
[`known-gaps.md`](known-gaps.md)）。実行時に SVG を data URI として生成して渡す。

```js
/** 塗りつぶし円のマーカーアイコンを SVG data URI として生成する。 */
function circleMarkerIconUrl(fillColor, strokeColor = '#ffffff', radiusPx = 8) {
  const size = (radiusPx + 2) * 2;
  const center = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${center}" cy="${center}" r="${radiusPx}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const marker = new geolonia.maps.Marker({
  position: { lat, lng },
  map,
  icon: { url: circleMarkerIconUrl('#1a73e8') },
});
```

## ステータス変化に応じてアイコンを更新する

`marker.setIcon({ url: ... })` で再生成した data URI に差し替えれば、Google Maps の
`marker.setIcon(newIcon)` と同じ感覚で使える。

```js
function syncIcon(marker, status, colorMap) {
  marker.setIcon({ url: circleMarkerIconUrl(colorMap[status]) });
}
```

## 注意点

- `radiusPx` はマーカー画像のピクセルサイズに直結する。Google Maps の `scale` と完全に
  同じ見た目にはならないので、実装時に見た目を確認しながら調整する。
- 多数のマーカーで異なる色を使う場合、同じ色の組み合わせは同じ data URI 文字列になるため
  ブラウザの画像キャッシュが効く。色の種類が多い場合でも実用上の性能問題は出にくい。
