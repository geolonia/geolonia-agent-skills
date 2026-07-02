# マップスタイル

## 組み込みスタイル

`data-style` 属性または `geolonia.Map` の `style` オプションで指定する。

| スタイル名 | 説明 |
|---|---|
| `geolonia/basic-v2` | デフォルトのグローバルマップスタイル（現行の既定） |
| `geolonia/basic-v1` | 初代のワールドマップスタイル |
| `geolonia/basic` | 基本スタイル（現行 basic 系のエイリアス。現在は basic-v2 相当） |
| `geolonia/gsi` | 国土地理院データ + OpenStreetMap ベース（GSI Japan） |
| `geolonia/midnight` | ダークテーマ（Geolonia Midnight） |
| `geolonia/red-planet` | 赤系のテーマスタイル（Geolonia Red Planet） |
| `geolonia/notebook` | ノート風のテーマスタイル（Geolonia Notebook） |
| `geolonia/homework` | 手書き風のテーマスタイル（Geolonia Homework） |
| `geoloniamaps/smartcity-base` | スマートシティ向けベーススタイル |

namespace に注意する。標準スタイルは `geolonia/` 配下だが、`smartcity-base` のみ `geoloniamaps/` 配下にある。

### 使用例

Embed API:

```html
<div class="geolonia" data-style="geolonia/gsi" style="height: 400px;"></div>
```

JavaScript API:

```javascript
const map = new geolonia.Map({
  container: 'map',
  style: 'geolonia/midnight'
});
```

## カスタムスタイル

### 外部 style.json を使用

自前の style.json URL を指定する場合、Geolonia API キーは不要:

```html
<div class="geolonia" data-style="https://example.com/my-style.json" style="height: 400px;"></div>
```

```javascript
const map = new geolonia.Map({
  container: 'map',
  style: 'https://example.com/my-style.json'
});
```

### スタイルのカスタマイズ

Geolonia のスタイルリポジトリはテンプレートリポジトリとして公開されており、フォークしてカスタマイズできる:

- https://github.com/geoloniamaps

カスタマイズしたスタイルは GitHub Pages にデプロイして style.json として公開可能。

### スタイルプレビュー

スタイルのプレビューツール: https://geolonia.github.io/preview/

## タイル・フォント

- タイルスキーマ: OpenMapTiles 互換（https://github.com/geolonia/openmaptiles）
- グリフ（フォント）: `https://glyphs.geolonia.com/fonts/{fontstack}/{range}.pbf`
