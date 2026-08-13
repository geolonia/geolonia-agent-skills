# マーカーアイコン（SymbolPath / 画像 URL）

`MarkerOptions.icon` はベクター記号（`SymbolPath`）に対応している。Google Maps の
`icon` 指定は**ほぼそのまま移植できる**。`Symbol` で表現できる単純な記号のために
「SVG data URI を自前で組み立てる」必要はない。複数パス・グラデーション・テキスト入りなど
`Symbol` で表現しきれないアイコンでは、いまも data URI を使う（後述）。

## そのまま移植できるもの

```js
// Before（Google Maps）
new google.maps.Marker({
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

// After（@geolonia/maps-suite）
new geolonia.maps.Marker({
  position: { lat, lng },
  map,
  icon: {
    path: geolonia.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: '#1a73e8',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  },
});
```

`icon` に渡せる型は `{ url: string }`（画像）または `Symbol`（ベクター記号）。
`Symbol` のフィールドは `path` / `fillColor` / `fillOpacity` / `strokeColor` /
`strokeOpacity` / `strokeWeight` / `scale` / `rotation`。

`SymbolPath` の定数は `CIRCLE` / `FORWARD_CLOSED_ARROW` / `FORWARD_OPEN_ARROW` /
`BACKWARD_CLOSED_ARROW` / `BACKWARD_OPEN_ARROW` の 5 つで、Google Maps と同じ顔ぶれ。
`path` には SVG のパス記法の文字列も渡せるので、独自形状もそのまま移植できる。

```js
icon: {
  path: 'M 0 -1 L 1 1 L -1 1 Z', // SVG パス記法
  scale: 10,
  fillColor: '#e53935',
  fillOpacity: 1,
}
```

`scale` はパス座標に乗じてピクセルサイズを決める。Google Maps の `scale` と考え方は同じだが
描画結果が 1 px 単位まで一致する保証は無いので、見た目は実際に確認して調整する。

## ステータスに応じてアイコンを更新する

`marker.setIcon(icon)` は Google Maps と同じ感覚で使える（`null` を渡すと既定のマーカーに戻る）。

```js
function syncIcon(marker, status, colorMap) {
  marker.setIcon({
    path: geolonia.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: colorMap[status],
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  });
}
```

## 画像アイコン（`{ url }`）を使う場合

写真やブランドロゴなど、ベクター記号で表現できないアイコンは従来通り `{ url: '...' }`。
SVG を data URI にして渡す書き方も引き続き有効で、`Symbol` では表現しきれない
（複数パス・グラデーション・テキスト入りなど）アイコンではこちらを使う。

```js
function badgeIconUrl(label, fillColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="${fillColor}"/><text x="16" y="21" font-size="14" text-anchor="middle" fill="#fff">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

new geolonia.maps.Marker({ position, map, icon: { url: badgeIconUrl('3', '#1a73e8') } });
```

同じ内容の data URI は同じ文字列になるためブラウザの画像キャッシュが効く。色や数字の
バリエーションが多くても実用上の性能問題は出にくい。

## 未対応のオプション

`MarkerOptions` は `position` / `map` / `title` / `icon` のみ。`draggable` / `label` /
`zIndex` / `animation` / `opacity` は無い（[`known-gaps.md`](known-gaps.md) の残ギャップ 2）。
`label` 相当の表示が必要なら上記の data URI にテキストを埋め込むか、
`AdvancedMarkerElement` で任意の DOM を置く。
