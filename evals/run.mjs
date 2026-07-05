#!/usr/bin/env node
// スキル eval ハーネス（npm 依存なし・Node 標準のみ）。
//
// スキル資料を注入した場合（with-skill）としない場合（baseline）で LLM の回答を生成し、
// 決定論的な substring チェックで採点して比較する。スキルが実際に回答を改善するか
// （discriminating power）を可視化する。
//
// 使い方:
//   node evals/run.mjs                     # 既定: Ollama (EVAL_MODEL, 既定 gpt-oss:20b)
//   EVAL_MODEL=qwen3:4b node evals/run.mjs # 別のローカルモデル
//   EVAL_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-... EVAL_MODEL=claude-haiku-4-5-20251001 node evals/run.mjs
//
// 判定:
//   has     … 全て含むべき substring
//   hasAny  … いずれかを含むべき substring 群
//   notHas  … 含むべきでない substring

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.join(HERE, '..', 'skills', 'maps');

const PROVIDER = process.env.EVAL_PROVIDER || 'ollama';
const MODEL = process.env.EVAL_MODEL || (PROVIDER === 'anthropic' ? 'claude-haiku-4-5-20251001' : 'gpt-oss:20b');

const TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS || 300_000);

const config = JSON.parse(fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8'));

if (PROVIDER === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
  console.error('EVAL_PROVIDER=anthropic には ANTHROPIC_API_KEY が必要です。');
  process.exit(1);
}

const skillText = config.skillFiles
  .map((f) => `# ===== ${f} =====\n` + fs.readFileSync(path.join(SKILL_DIR, f), 'utf8'))
  .join('\n\n');

const BASELINE_SYS =
  'あなたは有能なWebフロントエンドのコーディング支援AIです。ユーザーの要望に対し、実際に動くコードを簡潔に示してください。';
const SKILL_SYS =
  'あなたは有能なWebフロントエンドのコーディング支援AIです。以下の Geolonia Maps スキル資料を参照し、関連する場合は必ずこれに従って正確なコードを示してください。\n\n' +
  skillText;

async function askOllama(system, prompt) {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      options: { temperature: 0, num_predict: 900 },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}. ollama serve が起動しているか確認してください。`);
  const data = await res.json();
  return (data.message && data.message.content) || '';
}

async function askAnthropic(system, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.content || []).map((c) => c.text || '').join('');
}

const ask = PROVIDER === 'anthropic' ? askAnthropic : askOllama;

function grade(text, c) {
  const checks = [];
  for (const s of c.has || []) checks.push([`has "${s}"`, text.includes(s)]);
  if ((c.hasAny || []).length)
    checks.push([`hasAny [${c.hasAny.join(' | ')}]`, c.hasAny.some((s) => text.includes(s))]);
  for (const s of c.notHas || []) checks.push([`notHas "${s}"`, !text.includes(s)]);
  return { pass: checks.every(([, ok]) => ok), checks };
}

async function main() {
  console.log(`provider: ${PROVIDER}  model: ${MODEL}\n`);
  const results = [];
  for (const c of config.cases) {
    process.stdout.write(`[${c.type}] ${c.id} ... `);
    const base = grade(await ask(BASELINE_SYS, c.prompt), c);
    const skill = grade(await ask(SKILL_SYS, c.prompt), c);
    results.push({ c, base, skill });
    console.log(`baseline:${base.pass ? 'PASS' : 'FAIL'}  with-skill:${skill.pass ? 'PASS' : 'FAIL'}`);
  }

  const b = results.filter((r) => r.base.pass).length;
  const s = results.filter((r) => r.skill.pass).length;

  console.log('\n================ 結果サマリ ================');
  for (const r of results) {
    console.log(
      `${r.c.type.padEnd(12)} ${r.c.id.padEnd(26)} baseline:${r.base.pass ? 'PASS' : 'FAIL'}  with-skill:${r.skill.pass ? 'PASS' : 'FAIL'}`
    );
  }
  console.log('-------------------------------------------');
  console.log(`baseline   : ${b}/${results.length} PASS`);
  console.log(`with-skill : ${s}/${results.length} PASS`);
  console.log(`skill による改善: +${s - b}`);

  console.log('\n================ チェック内訳 ================');
  for (const r of results) {
    const fmt = (g) => g.checks.map(([n, ok]) => `${ok ? 'o' : 'x'} ${n}`).join('  |  ');
    console.log(`\n[${r.c.type}] ${r.c.id}`);
    console.log(`  baseline  : ${fmt(r.base)}`);
    console.log(`  with-skill: ${fmt(r.skill)}`);
  }

  // ケース単位で baseline:PASS -> with-skill:FAIL の退行を検知する。
  // 合計 PASS 数の比較だけだと、あるケースの改善が別ケース（例: Negative の
  // 過剰適用防止）の退行を打ち消して見逃すため、ケース単位で判定する。
  const regressed = results.filter((r) => r.base.pass && !r.skill.pass);
  if (regressed.length > 0) {
    console.error(`\nスキル注入で以下のケースが退行しました: ${regressed.map((r) => r.c.id).join(', ')}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
