#!/usr/bin/env node
'use strict';

/**
 * スキルの構造を検証する。
 *
 * 各 skills/<name>/SKILL.md について以下を確認する。
 *  - 先頭に YAML frontmatter（--- で囲まれたブロック）がある
 *  - frontmatter に name と description が存在する
 *  - name がディレクトリ名と一致する
 *  - frontmatter を除いた本文が空でない
 *  - 本文が長すぎない（既定 500 行以内）
 *
 * AGENTS.md など SKILL.md 以外のファイルは任意扱いで、存在しなくてもエラーにしない。
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const MAX_BODY_LINES = 500;

/** 単純な frontmatter パーサ。ネストは扱わず、トップレベルの key: value のみ取得する。 */
function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: null, body: content };
  }
  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return { frontmatter: null, body: content };
  }
  const raw = content.slice(3, end).trim();
  const body = content.slice(content.indexOf('\n', end + 1) + 1);
  const fm = {};
  let currentKey = null;
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      currentKey = m[1];
      fm[currentKey] = m[2];
    } else if (currentKey && line.trim() !== '') {
      // 折り返し（> や | の複数行 value）を連結する
      fm[currentKey] = (fm[currentKey] + ' ' + line.trim()).trim();
    }
  }
  return { frontmatter: fm, body };
}

function main() {
  const errors = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`skills ディレクトリが見つかりません: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (dirs.length === 0) {
    errors.push('skills 配下にスキルディレクトリがありません');
  }

  for (const dir of dirs) {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    const rel = path.relative(path.join(__dirname, '..'), skillPath);

    if (!fs.existsSync(skillPath)) {
      errors.push(`${rel}: SKILL.md がありません`);
      continue;
    }

    const content = fs.readFileSync(skillPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter) {
      errors.push(`${rel}: frontmatter（--- で囲まれたブロック）がありません`);
      continue;
    }
    if (!frontmatter.name) {
      errors.push(`${rel}: frontmatter に name がありません`);
    } else if (frontmatter.name !== dir) {
      errors.push(`${rel}: name "${frontmatter.name}" がディレクトリ名 "${dir}" と一致しません`);
    }
    if (!frontmatter.description) {
      errors.push(`${rel}: frontmatter に description がありません`);
    }
    if (body.trim() === '') {
      errors.push(`${rel}: 本文が空です`);
    }
    const bodyLines = body.split('\n').length;
    if (bodyLines > MAX_BODY_LINES) {
      errors.push(`${rel}: 本文が ${bodyLines} 行あります（上限 ${MAX_BODY_LINES} 行）。詳細は参照ファイルに分割してください`);
    }
  }

  if (errors.length > 0) {
    console.error('スキル検証に失敗しました:');
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log(`スキル検証に成功しました（${dirs.length} 個のスキルを確認）`);
}

main();
