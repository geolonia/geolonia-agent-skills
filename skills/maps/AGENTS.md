# Geolonia Maps クイックリファレンス（エージェント向け）

`SKILL.md` の凝縮版。詳細は同ディレクトリの各リファレンスファイルを参照する。

## 要点

- Geolonia Maps は MapLibre GL JS の拡張。`maplibregl.*` を `geolonia.*` に置換すれば全メソッド・イベントが使える。
- CDN 埋め込み: `<script src="https://cdn.geolonia.com/embed/v5/embed?geolonia-api-key=YOUR-API-KEY"></script>`
- `class="geolonia"` を持つ `<div>`（CSS で height 指定が必要）は自動で地図に変換される（Embed API）。
- デフォルトのマップスタイルは `geolonia/basic-v2`。
- 動的な操作は `new geolonia.Map(...)`（JavaScript API）。

## 使い分け

- HTML の data 属性だけで表示できる → Embed API を使う
- 動的な操作が必要 → JavaScript API（`geolonia.Map`）を使う
- 外部の style.json を指定する → API キー不要

## Do not（やってはいけない）

- 新規実装で旧 CDN URL `cdn.geolonia.com/v1/embed` を使わない。`embed/v5/embed` を使う。
- デフォルトスタイルを `geolonia/basic-v1` と仮定しない。現行の既定は `geolonia/basic-v2`。
- MapLibre の API を Geolonia 用に書き換えようとしない。名前空間を `geolonia` に置換するだけでよい。
- Google Maps や Mapbox の SDK と混在させない。
- API キーを公開リポジトリやコミットに直書きしない。
