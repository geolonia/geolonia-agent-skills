# Embed API リファレンス

class="geolonia" を持つ `<div>` 要素が自動的に地図に変換される。
`<div>` には CSS で高さ（height）を指定する必要がある。

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

### 位置・表示

| 属性 | 説明 | デフォルト |
|---|---|---|
| `data-lat` | 緯度 | - |
| `data-lng` | 経度 | - |
| `data-zoom` | ズームレベル（0〜22） | - |
| `data-bearing` | 地図の回転角度（0〜359） | `0` |
| `data-pitch` | 地図の傾き（0〜60） | `0` |
| `data-hash` | URL ハッシュと地図状態を同期 | `off` |
| `data-min-zoom` | 最小ズームレベル | - |
| `data-max-zoom` | 最大ズームレベル | `20` |

### スタイル

| 属性 | 説明 | デフォルト |
|---|---|---|
| `data-style` | マップスタイル名または style.json の URL | `geolonia/basic-v2` |
| `data-lang` | 地図の言語（`auto`, `ja`, `en`） | `auto` |
| `data-3d` | 3D ビル表示 | `off` |

### マーカー

| 属性 | 説明 | デフォルト |
|---|---|---|
| `data-marker` | マーカー表示（`on` / `off`） | `on` |
| `data-marker-color` | マーカーの色（CSS カラー値） | `#E4402F` |
| `data-open-popup` | 初期表示でポップアップを開く（`on` / `off`） | `off` |
| `data-custom-marker` | カスタムマーカーの HTML | - |
| `data-custom-marker-offset` | カスタムマーカーの表示オフセット | - |

### GeoJSON

| 属性 | 説明 | デフォルト |
|---|---|---|
| `data-geojson` | GeoJSON ファイルの URL | - |
| `data-cluster` | クラスタリング有効化 | `on` |
| `data-cluster-color` | クラスターの円の色 | - |

### UI コントロール

| 属性 | 説明 | デフォルト |
|---|---|---|
| `data-navigation-control` | ナビゲーションコントロールの位置（`top-right`, `top-left`, `bottom-right`, `bottom-left`, `off`） | - |
| `data-geolocate-control` | 現在地取得コントロールの位置、または `off` | - |
| `data-fullscreen-control` | フルスクリーンコントロールの位置、または `off` | - |
| `data-scale-control` | スケールコントロールの位置、または `off` | - |
| `data-geolonia-control` | Geolonia アトリビューション（ロゴ）コントロールの位置、または `off` | - |

### その他

| 属性 | 説明 | デフォルト |
|---|---|---|
| `data-key` | API キー（script URL で指定する代わり） | - |
| `data-loader` | ローディングアニメーション | `on` |
| `data-lazy-loading` | 遅延読み込み | `on` |
| `data-gesture-handling` | スクロール・タッチ操作の制御 | - |
| `data-simple-vector` | Simplestyle 仕様のベクトルデータを追加 | - |
| `data-plugin` | Embed プラグインの有効化 | `off` |
