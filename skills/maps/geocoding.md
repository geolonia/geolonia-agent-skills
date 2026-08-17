# ジオコーディング

## Community Geocoder（住所 → 座標）

無料・オープンソースの日本語住所ジオコーディング API。
国土交通省の位置参照情報データを使用。

### CDN

```html
<script src="https://cdn.geolonia.com/community-geocoder.js"></script>
```

### 使い方

```javascript
getLatLng('東京都千代田区丸の内1-1-1', (result) => {
  console.log(result);
  // {
  //   "addr": "1-1-1",
  //   "city": "千代田区",
  //   "lat": 35.673944,
  //   "lng": 139.752558,
  //   "level": 3,
  //   "pref": "東京都",
  //   "town": "丸の内"
  // }
}, (error) => {
  console.error(error);
});
```

### 正規化レベル

| level | 意味 |
| --- | --- |
| 0 | 都道府県を特定できなかった |
| 1 | 都道府県まで特定 |
| 2 | 市区町村まで特定 |
| 3 | 町丁目まで特定 |

### 注意事項

- 静的ファイルベースの API（GitHub Pages から配信、サーバーサイド処理なし）
- 取得した座標の利用制限なし
- MIT ライセンス、帰属表示不要
- リポジトリ: https://github.com/geolonia/community-geocoder

## Open Reverse Geocoder（座標 → 住所）

座標から都道府県・市区町村名を取得する逆ジオコーディング。

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@geolonia/open-reverse-geocoder@latest/dist/index.js"></script>
```

### 使い方

```javascript
const { openReverseGeocoder } = window;

const result = await openReverseGeocoder([139.7673068, 35.6809591]);
// { "code": "13101", "prefecture": "東京都", "city": "千代田区" }
```

- ベクトルタイルのポリゴンデータを使用
- 個人情報の収集なし
- リポジトリ: https://github.com/geolonia/open-reverse-geocoder

## 住所正規化（normalize-japanese-addresses）

表記揺れのある日本語住所を正規化して構造化データに変換する。

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@geolonia/normalize-japanese-addresses@latest/dist/index.js"></script>
```

### 使い方

```javascript
const { normalize } = window.Geolonia;

const result = await normalize('東京都千代田区丸の内1-1-1');
// { pref: '東京都', city: '千代田区', town: '丸の内一丁目', addr: '1-1', lat: ..., lng: ..., level: 3 }
```

- 半角/全角、漢数字/算用数字、旧字体などの表記揺れを吸収
- リポジトリ: https://github.com/geolonia/normalize-japanese-addresses
