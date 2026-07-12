# Geolonia Skill

Geolonia Maps を使った地図アプリ開発を支援する [Claude Code](https://code.claude.com/) プラグインです。

## 含まれるスキル

### maps

Geolonia Maps（MapLibre GL JS ベース）を使った地図アプリの開発を支援します。

- **Embed API**: HTML の `data-*` 属性による宣言的な地図埋め込み
- **JavaScript API**: `geolonia.Map` / `Marker` / `Popup` / `SimpleStyle` によるプログラマティックな操作
- **ジオコーディング**: Community Geocoder（住所→座標）、Reverse Geocoder（座標→住所）、住所正規化
- **マップスタイル**: 組み込みスタイル一覧とカスタマイズ方法

セットアップは CDN 埋め込みに統一しています。

### geolonia-google-maps-migration

Google Maps JavaScript API から `@geolonia/maps-suite`（Google Maps 互換 API を持つ
MapLibre GL JS ベースのライブラリ）への移行を支援します。

- **移行手順**: 棚卸し → インストール → API キー取得 → 地図初期化 → マーカー/InfoWindow/
  クラスタリング → Polyline 代替 → ビルド・動作確認
- **API 対応表**: `google.maps.*` と `geolonia.maps.*` のクラス・メソッド対応
- **既知のギャップ**: Polyline/Polygon 未実装、ベクター記号アイコン未対応、
  `panTo()` が `setZoom()` にキャンセルされる互換性バグ、とその回避策

## 要件

- Claude Code v1.0.33 以降

## インストール

マーケットプレイスから追加してインストールします。

```text
/plugin marketplace add geolonia/geolonia-agent-skills
/plugin install geolonia@geolonia
```

## 使い方

地図関連のリクエストをすると、Claude が自動的にスキルを読み込みます。

```text
「Geolonia Maps で東京タワーにマーカーを置いた地図を作って」
```

明示的に呼び出す場合はスラッシュコマンドを使います。

```text
/geolonia:maps
```

## ローカル開発

リポジトリをクローンして `--plugin-dir` フラグで直接読み込みます。

```bash
git clone git@github.com:geolonia/geolonia-agent-skills.git
```

任意のプロジェクトディレクトリで Claude Code を起動する際にプラグインを指定します。

```bash
cd /path/to/your-project
claude --plugin-dir /path/to/skill
```

スキルファイルを編集した場合は、Claude Code を再起動すると変更が反映されます。

### バリデーション

プラグインの構成が正しいか検証できます。

```bash
claude plugin validate /path/to/skill
```

## プラグイン構成

```text
.claude-plugin/
└── plugin.json                # プラグイン定義
skills/
├── maps/
│   ├── SKILL.md               # メインスキル定義（自動呼び出し条件 + 基本原則）
│   ├── embed-api.md           # Embed API リファレンス（data-* 属性一覧）
│   ├── javascript-api.md      # JavaScript API リファレンス
│   ├── geocoding.md           # ジオコーディング（住所↔座標変換・住所正規化）
│   ├── styles.md              # マップスタイル一覧とカスタマイズ
│   └── examples.md            # よくあるパターンのコード例
└── geolonia-google-maps-migration/
    ├── SKILL.md               # メインスキル定義（移行手順 + 振り返り）
    ├── AGENTS.md              # 凝縮版クイックリファレンス
    └── references/
        ├── known-gaps.md      # maps-suite に無い機能と回避策
        ├── api-differences.md # 細部が異なる API（InfoWindow.open() など）
        ├── marker-icons.md    # ベクター記号アイコンの SVG 代替実装
        └── polyline-workaround.md # Polyline/Polygon の GeoJSON レイヤー代替実装
```

## ライセンス

MIT
