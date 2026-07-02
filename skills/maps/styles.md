# マップスタイル

## 組み込みスタイル

`data-style` 属性または `geolonia.Map` の `style` オプションで指定する。

| スタイル名 | 説明 |
|---|---|
| `geolonia/basic-v2` | デフォルトのグローバルマップスタイル（現行の既定） |
| `geolonia/basic-v1` | 初代のワールドマップスタイル |
| `geolonia/gsi` | 国土地理院データ + OpenStreetMap ベース |
| `geolonia/midnight` | ダークテーマ |

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
