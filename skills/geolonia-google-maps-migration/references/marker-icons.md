# マーカーアイコン（SymbolPath / 画像 URL / ラベル）

`MarkerOptions.icon` はベクター記号（`SymbolPath`）に対応している。Google Maps の
`icon` 指定は**ほぼそのまま移植できる**。`Symbol` で表現できる単純な記号のために
「SVG data URI を自前で組み立てる」必要はない。アイコンに文字を重ねるのも `label` で書ける。
複数パス・グラデーションなど `Symbol` で表現しきれないアイコンでは、いまも data URI を使う
（後述）。

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
（複数パス・グラデーションなど）アイコンではこちらを使う。

```js
function ringIconUrl(fillColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="${fillColor}"/><circle cx="16" cy="16" r="7" fill="#fff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

new geolonia.maps.Marker({ position, map, icon: { url: ringIconUrl('#1a73e8') } });
```

同じ内容の data URI は同じ文字列になるためブラウザの画像キャッシュが効く。色や数字の
バリエーションが多くても実用上の性能問題は出にくい。

## ラベル（`label`）

Google Maps と同じく、文字列か `MarkerLabel` を渡す。ラベルはアイコンの中心（既定のピンでは
ピンの円の中心）に重ねて表示される。

```js
new geolonia.maps.Marker({ position, map, label: 'A' });

new geolonia.maps.Marker({
  position,
  map,
  icon: { path: geolonia.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#1a73e8', fillOpacity: 1 },
  label: { text: '3', color: '#fff', fontWeight: 'bold' },
});
```

`MarkerLabel` で指定できるのは `text` / `color`（既定 `#000000`）/ `fontSize`（既定 `14px`）/
`fontWeight` / `fontFamily` / `className`。空文字の `text` ではラベルを表示しない。
後から変えるときは `setLabel()`、外すときは `setLabel(null)`。

## 重なり順（`zIndex`）

値が大きいマーカーほど手前に表示される。省略したマーカーは既定の重なり順になる。後から
変えるときは `setZIndex()`。マーカーは常に図形（`Polyline` / `Polygon` など）より手前に出る。

## 未対応のオプション

`draggable` / `animation` / `opacity` / `anchorPoint` は無い（[`known-gaps.md`](known-gaps.md)
の残ギャップ 2）。任意の DOM を置きたい場合は `AdvancedMarkerElement` を使う。
