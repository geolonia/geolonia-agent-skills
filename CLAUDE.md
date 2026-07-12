# Geolonia Skill

## 目的

Geolonia Maps を使った地図アプリの開発を Claude Code で支援するためのプラグイン。
Geolonia Maps の Embed API、JavaScript API、ジオコーディング、マップスタイルなどの知識を Claude に提供し、正確なコード生成を可能にする。

## 構成

```text
.claude-plugin/
└── plugin.json                # プラグイン定義（名前・バージョン・著者）
skills/
├── maps/
│   ├── SKILL.md               # メインスキル定義（自動呼び出し条件 + 基本原則）
│   ├── embed-api.md           # Embed API リファレンス（data-* 属性一覧）
│   ├── javascript-api.md      # JavaScript API リファレンス
│   ├── geocoding.md           # ジオコーディング（住所↔座標変換・住所正規化）
│   ├── styles.md              # マップスタイル一覧とカスタマイズ
│   └── examples.md            # よくあるパターンのコード例
└── geolonia-google-maps-migration/
    ├── SKILL.md               # Google Maps → @geolonia/maps-suite 移行手順 + 振り返り
    ├── AGENTS.md              # 凝縮版クイックリファレンス
    └── references/            # 既知のギャップ・API差異・回避策の実装例
```

## 方針

- セットアップは CDN 埋め込みに統一（npm install は使わない）。ただし
  `geolonia-google-maps-migration` は `@geolonia/maps-suite` の npm パッケージ利用が前提
  （Google Maps からの移行元コードが npm ベースであることが多いため）
- SKILL.md は軽量に保ち、詳細は参照ファイルに分離する
- Geolonia Maps は MapLibre GL JS の拡張であることを前提とする
- `@geolonia/maps-suite` の既知の未実装機能・互換性バグは
  `tmp/geolonia-maps/sdk/issues/maps-suite/`（ワークスペース内、このリポジトリの外）に
  記録し、upstream で解消されるまで `geolonia-google-maps-migration/references/known-gaps.md`
  に回避策を明記する
