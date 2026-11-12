# Embed API リファレンス

`class="geolonia"` を持つ要素は、自動的に地図に変換される。要素には CSS で高さ（height）を指定する必要がある。

記述は `@geolonia/embed` v6.0.1（CDN の `embed/v6/embed`）の実装に合わせている。

## 最小構成

```html
<div class="geolonia" style="height: 400px;"></div>
```

## マーカーにポップアップを追加

div の中に HTML を書くと、マーカーのポップアップとして表示される:

```html
<div class="geolonia" data-lat="35.6812" data-lng="139.7671" data-zoom="16" style="height: 400px;">
  <h3>東京駅</h3>
  <p>東京都千代田区丸の内1丁目</p>
</div>
```

## data 属性一覧

- 値はすべて文字列で書く。on/off の属性は `on` か `off` を指定する。
- 一覧に無い `data-*` 属性もそのまま Embed プラグインに渡る（[JavaScript API リファレンス](javascript-api.md) のプラグインの節を参照）。

### 位置・表示

| 属性 | 説明 | デフォルト |
| --- | --- | --- |
| `data-lat` | 地図の中心の緯度。`data-lng` と両方あるときだけ使う | - |
| `data-lng` | 地図の中心の経度。`data-lat` と両方あるときだけ使う | - |
| `data-zoom` | ズームレベル | `0` |
| `data-bearing` | 地図の回転角度（度） | `0` |
| `data-pitch` | 地図の傾き（度） | `0` |
| `data-hash` | 地図の表示位置を URL のハッシュと同期する（`on` / `off`） | `off` |
| `data-min-zoom` | 最小ズームレベル | 指定なし |
| `data-max-zoom` | 最大ズームレベル | `20` |

`data-lat` と `data-lng` を省き、`data-geojson` を指定すると、地図は GeoJSON の範囲に合わせて表示される。

### スタイル

| 属性 | 説明 | デフォルト |
| --- | --- | --- |
| `data-style` | スタイル名（`geolonia/basic-v2` など）、style.json の URL、または相対パス | `geolonia/basic-v2` |
| `data-lang` | ラベルの言語。`ja` は日本語、`auto` はブラウザの言語、それ以外の値は英語になる | ブラウザの言語（`auto` と同じ） |
| `data-3d` | 対応するスタイルで建物などを 3D で描く（`on` / `off`） | `off` |

指定できるスタイル名は [マップスタイル](styles.md) を参照する。

### マーカー

| 属性 | 説明 | デフォルト |
| --- | --- | --- |
| `data-marker` | 地図の中心にマーカーを表示する（`on` / `off`）。`data-lat` と `data-lng` があるときだけ表示される | `on` |
| `data-marker-color` | マーカーの色（CSS カラー値） | `#E4402F` |
| `data-open-popup` | 読み込み時にマーカーのポップアップを開く（`on` / `off`） | `off` |
| `data-custom-marker` | マーカーとして使う要素の CSS セレクタ | 指定なし |
| `data-custom-marker-offset` | カスタムマーカーのずらし量。`"x, y"` 形式のピクセル値 | `0, 0` |

要素の中に書いた HTML は、マーカーのポップアップの中身になる（上の「マーカーにポップアップを追加」を参照）。

### GeoJSON

| 属性 | 説明 | デフォルト |
| --- | --- | --- |
| `data-geojson` | GeoJSON の URL、JSON の文字列、またはページ内の要素（`<script type="application/json">` など）を指す CSS セレクタ | 指定なし |
| `data-cluster` | ポイントをクラスタリングする（`on` / `off`） | `on` |
| `data-cluster-color` | クラスタの円の色 | `#ff0000` |
| `data-simple-vector` | simplestyle で描くベクトルタイルの URL、または Geolonia のカスタムタイルの ID | 指定なし |

GeoJSON の地物の色や線の太さは、地物の properties に [simplestyle-spec](https://github.com/mapbox/simplestyle-spec) のキー（`marker-color`、`fill`、`stroke` など）を書いて指定する。

### データの値で描き分ける

GeoJSON の properties の値に応じて、色や大きさを変えて描く。MapLibre の式を書かずに済む。どれも `data-geojson` と組み合わせて使う。

| 属性 | 説明 |
| --- | --- |
| `data-choropleth` | ポリゴンを、このプロパティの数値で塗り分ける（コロプレス図） |
| `data-choropleth-colors` | 塗り分けの色。値の小さい側から順にカンマで区切る。既定は `#FFF2CC, #FFAB40, #EA5C0D, #B3261E` |
| `data-choropleth-range` | 色を割り当てる値の範囲。`"最小,最大"` 形式。省くか、読めない値（最小が最大以上など）のときはデータの最小値と最大値を使う |
| `data-heatmap` | ポイントをヒートマップで描く。`on` ならすべて同じ重み、プロパティ名を書くとその値を重みにする。`off` か空なら描かない |
| `data-heatmap-colors` | ヒートマップの色。密度の低い側から順にカンマで区切る。既定は `#FABF3D, #FFAB40, #EA5C0D, #B3261E` |
| `data-circle-size` | ポイントを円で描き、このプロパティの値で円の大きさ（半径 3〜11 ピクセル）を変える |
| `data-circle-color` | ポイントを円で描き、このプロパティの値で円の色を変える。値がすべて数値なら連続した色、それ以外は値ごとに別の色にする |
| `data-circle-colors` | `data-circle-color` に使う色をカンマで区切る。数値なら小さい側から、カテゴリなら出現順に割り当てる |

```html
<!-- 人口で市区町村のポリゴンを塗り分ける -->
<div
  class="geolonia"
  data-geojson="./cities.geojson"
  data-choropleth="population"
  data-choropleth-colors="#FFF2CC, #B3261E"
  data-choropleth-range="0,1000000"
  style="height: 400px;"
></div>

<!-- 店舗の売上でヒートマップを描く -->
<div class="geolonia" data-geojson="./shops.geojson" data-heatmap="sales" style="height: 400px;"></div>

<!-- 売上で円の大きさ、業種で円の色を変える -->
<div
  class="geolonia"
  data-geojson="./shops.geojson"
  data-circle-size="sales"
  data-circle-color="category"
  style="height: 400px;"
></div>
```

- `-colors` と `-range` の属性は、描き分けを有効にする属性（`data-choropleth`、`data-heatmap`、`data-circle-size` か `data-circle-color`）が無いと無視される。
- 色はカンマで区切るが、`rgb(0, 0, 0)` のように括弧の中にあるカンマは区切りとして扱わない。
- 描き分けは、地物の simplestyle の `fill` や `marker-color` より優先する。値が数値でない地物は simplestyle の見た目に戻る。
- `data-choropleth` では、`fill-opacity` を持たないポリゴンは背景の地図が透けるよう不透明度 0.7 で描く。
- `data-heatmap` と `data-circle-*` はクラスタリングを止める。`data-heatmap` はポイントのマーカーを描かない。`data-circle-*` は `marker-symbol` を持つポイントも含めてすべて円で描き、アイコンとタイトルは出さない。
- `data-circle-color` では、`"12"` のような数字の文字列は数値ではなくカテゴリとして扱う。オブジェクトや配列の値は色分けしない。

### UI コントロール

位置を指定する属性には `on`、`off`、または表示位置（`top-right`、`top-left`、`bottom-right`、`bottom-left`）を書く。

| 属性 | 説明 | デフォルト |
| --- | --- | --- |
| `data-navigation-control` | ズームと回転のコントロール | `on` |
| `data-geolocate-control` | 現在地のコントロール | `off` |
| `data-fullscreen-control` | 全画面のコントロール | `off` |
| `data-scale-control` | スケールバー | `off` |
| `data-geolonia-control` | Geolonia のロゴのコントロール | `on` |

### その他

| 属性 | 説明 | デフォルト |
| --- | --- | --- |
| `data-key` | API キー。CDN の URL の `geolonia-api-key` の代わりに要素ごとに指定する | URL で指定したキー |
| `data-gesture-handling` | スクロールできるページで、地図の操作に 2 本指などを求める（`on` / `off`） | `on` |
| `data-loader` | 地図の読み込み中にローディング表示を出す（`on` / `off`） | `on` |
| `data-lazy-loading` | 要素が画面に入るまで地図の初期化を遅らせる。`off` にするとページの読み込み時にすぐ初期化する | `on` |
| `data-plugin` | プラグインに渡す値。embed 自身はこの値を見ず、`atts.plugin` としてプラグインに渡す。どの値で何をするかはプラグインが決める | `off` |
