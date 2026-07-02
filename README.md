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
└── maps/
    ├── SKILL.md               # メインスキル定義（自動呼び出し条件 + 基本原則）
    ├── embed-api.md           # Embed API リファレンス（data-* 属性一覧）
    ├── javascript-api.md      # JavaScript API リファレンス
    ├── geocoding.md           # ジオコーディング（住所↔座標変換・住所正規化）
    ├── styles.md              # マップスタイル一覧とカスタマイズ
    └── examples.md            # よくあるパターンのコード例
```

## ライセンス

MIT
