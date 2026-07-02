# Geolonia Skill

## 目的

Geolonia Maps を使った地図アプリの開発を Claude Code で支援するためのプラグイン。
Geolonia Maps の Embed API、JavaScript API、ジオコーディング、マップスタイルなどの知識を Claude に提供し、正確なコード生成を可能にする。

## 構成

```text
.claude-plugin/
└── plugin.json                # プラグイン定義（名前・バージョン・著者）
skills/
└── maps/
    ├── SKILL.md               # メインスキル定義（自動呼び出し条件 + 基本原則）
    ├── embed-api.md           # Embed API リファレンス（data-* 属性一覧）
    ├── javascript-api.md      # JavaScript API リファレンス
    ├── geocoding.md           # ジオコーディング（住所↔座標変換・住所正規化）
    ├── styles.md              # マップスタイル一覧とカスタマイズ
    └── examples.md            # よくあるパターンのコード例
```

## 方針

- セットアップは CDN 埋め込みに統一（npm install は使わない）
- SKILL.md は軽量に保ち、詳細は参照ファイルに分離する
- Geolonia Maps は MapLibre GL JS の拡張であることを前提とする
