# スキル eval

スキル資料（Markdown）を **注入した場合（with-skill）** と **しない場合（baseline）** で LLM の回答を生成し、決定論的なチェックで採点して比較します。目的は「このスキルは AI の回答を実際に良くするか（discriminating power）」を数値で確かめること、そして内容が実装から陳腐化したときに検知することです。

## 実行方法

npm 依存はありません。Node 標準機能だけで動きます。グローバル `fetch` を使うため **Node 18 以上** が必要です（`AbortSignal.timeout` を使うため 17.3 以上でも可ですが、18 LTS 以上を推奨）。

```bash
# 既定: ローカルの Ollama を使う（API キー不要）
node evals/run.mjs

# モデルを変える
EVAL_MODEL=qwen3:4b node evals/run.mjs

# Anthropic API を使う（本番モデルに近い評価）
EVAL_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-... EVAL_MODEL=claude-haiku-4-5-20251001 node evals/run.mjs
```

Ollama を使う場合は `ollama serve` が起動している必要があります。

## テスト設計（4タイプ）

`cases.json` に定義します。各タイプを混ぜることで、トリガー精度・誤り矯正・過剰適用の防止を体系的に検証します。

| タイプ | 目的 |
| --- | --- |
| Explicit | トピックを直接名指しした質問 |
| Implicit | 解決策を名指しせず状況だけを述べた質問 |
| Anti-pattern | スキルが正すべき誤った前提を含む質問 |
| Negative | スキルを過剰適用してはいけない隣接質問 |

判定は substring ベースで、LLM ジャッジ不要・再現性ありです。

| キー | 意味 |
| --- | --- |
| `has` | すべて含むべき文字列 |
| `hasAny` | いずれかを含むべき文字列群 |
| `notHas` | 含むべきでない文字列 |

## discriminating power の考え方

良いスキルは「スキル無しでは落ち、スキル有りでは通る」テストで効果を示します。スキル無しでも通るテストは、そのスキルが価値を出していないか、テストが弱いことを意味します。`with-skill` が `baseline` を下回った場合は退行としてエラー終了します。

## CI について

eval は LLM の実行環境（ローカルモデルまたは API キー）を必要とするため、CI の自動チェック（`npm run check`）には含めていません。ローカルで随時実行してください。実装変更でスキルが古くなったとき（例: CDN URL やデフォルトスタイルの変更）に、このツールで検知できます。
