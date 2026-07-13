# 既知のギャップ（@geolonia/maps-suite v1.0.1 時点）

いずれも upstream（[geolonia/maps-suite](https://github.com/geolonia/maps-suite)）に issue
として起票済み。対処されるまではここに書く回避策を使うこと。upstream で修正されたら該当 issue
の状態と、このリファレンスの記述を更新すること。

## 1. Polyline / Polygon / Circle が存在しない

`geolonia.maps.Polyline` は無い。`geolonia.maps.importLibrary("marker")` が返すのも
`{ Marker, AdvancedMarkerElement, MarkerClusterer }` のみで `Polyline` は含まれない。

→ 実装例: [`polyline-workaround.md`](polyline-workaround.md)
→ 追跡: [geolonia/maps-suite#71](https://github.com/geolonia/maps-suite/issues/71)

## 2. Marker アイコンがベクター記号（SymbolPath）に対応していない

`MarkerOptions.icon` の型は `{ url: string } | null` のみ。Google Maps の
`{ path: google.maps.SymbolPath.CIRCLE, scale, fillColor, fillOpacity, strokeColor, strokeWeight }`
のようなベクター記号は渡せない。

→ 実装例: [`marker-icons.md`](marker-icons.md)
→ 追跡: [geolonia/maps-suite#72](https://github.com/geolonia/maps-suite/issues/72)

## 3. panTo() 直後の setZoom() がパンをキャンセルする（重要度: 高）

```js
map.panTo({ lat, lng }); // アニメーションでパン開始
map.setZoom(15);          // 直後に呼ぶと…
// 期待: パン先を中心に zoom 15
// 実際: 元の中心付近のまま zoom 15 になる
```

**原因**: `Map.setZoom()` は内部で MapLibre の `jumpTo()` を呼ぶ。`jumpTo()` は仕様として
呼び出し時に進行中のアニメーション（`panTo()` が使う `easeTo()`）を `stop()` で即座に
中断する。`panTo()`/`setZoom()` はどちらも `Map` 内部の同じ `_ready` Promise に
`.then()` でぶら下がっているため、ほぼ同一マイクロタスクで連続実行され、後から呼ばれた
（あるいは `jumpTo()` が同期発火する `moveend` で `_center` キャッシュが巻き戻る）方が
先勝ちしてしまう。呼び出し順序を入れ替えても同様に壊れる。

Google Maps では同じ書き方が問題なく動くため、maps-suite が「コード変更なしで移行できる」
ことを目的とする以上、これは**互換性バグ**として扱う（MapLibre 自体の不具合ではない）。

**回避策**: 公開 API（`panTo`/`setZoom`）を使わず、`map._getImpl()` で取得した生の
MapLibre インスタンスに対して 1 回の `easeTo` にまとめる。

```js
function panToAndZoom(map, latLng, zoom) {
  const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
  const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
  map._getImpl().easeTo({ center: [lng, lat], zoom });
}
```

`latLng` は `{lat, lng}` の literal（数値プロパティ）と `LatLng` インスタンス
（`marker.getPosition()` が返す、`lat()`/`lng()` メソッド）の両方を受け付けられるようにしておく。

→ 追跡: [geolonia/maps-suite#73](https://github.com/geolonia/maps-suite/issues/73)

## デバッグ時の切り分け方

アプリのコードが悪いのか、ライブラリ側の挙動なのか判断がつかない場合は、
`node_modules/@geolonia/maps-suite/dist/maps-suite.js`（IIFE バンドル）を単体の HTML から
読み込む最小の再現ページを作り、アプリのコードを介さずに再現するかどうかを先に確認する。
アプリ側のロジックを疑って延々デバッグするより早く原因を切り分けられる。
