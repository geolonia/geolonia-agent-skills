---
name: maps
description: >
  Geolonia Maps を使った地図アプリの開発を支援する。地図の埋め込み、
  マーカー・ポップアップの追加、GeoJSON データの表示、ジオコーディング、
  マップスタイルのカスタマイズなど、地図関連の実装時に使用する。
---

# Geolonia Maps 開発ガイド

## 概要

Geolonia Maps は MapLibre GL JS をベースにした日本向け地図プラットフォーム。
`maplibregl` の全クラスが `geolonia` 名前空間で利用でき、HTML の data 属性による宣言的な地図埋め込みも可能。

## セットアップ（CDN）

```html
<script type="text/javascript" src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>
```

- API キーは Geolonia のタイル・スタイルを使う場合に必要
- 外部の style.json を指定する場合は API キー不要
- `</body>` の直前に配置する
- 旧形式 `https://cdn.geolonia.com/v1/embed?...` はレガシー互換。新規実装では `embed/v5/embed` を使う

## 基本原則

1. **MapLibre GL JS 互換**: `maplibregl.Map` → `geolonia.Map`、`maplibregl.Marker` → `geolonia.Marker` のように名前空間を置換するだけで全メソッド・イベントが使える
2. **Embed API 優先**: コードを書かずに HTML の data 属性だけで地図を表示できる場合は Embed API を使う
3. **JavaScript API**: 動的な操作が必要な場合は `geolonia.Map` を使うプログラマティックな方法を使う
4. **日本向け最適化**: GSI スタイル、日本語住所正規化、Community Geocoder など日本特有の機能が充実

## リファレンス

各トピックの詳細は以下を参照:

- [Embed API リファレンス](embed-api.md) - data-* 属性の全一覧
- [JavaScript API リファレンス](javascript-api.md) - geolonia.Map、Marker、Popup、SimpleStyle、プラグイン
- [ジオコーディング](geocoding.md) - 住所→座標、座標→住所、住所正規化
- [マップスタイル](styles.md) - 組み込みスタイル一覧とカスタマイズ方法
- [コード例](examples.md) - よくあるパターンの実装例

## 公式ドキュメント

- https://docs.geolonia.com/
- https://github.com/geolonia/embed
