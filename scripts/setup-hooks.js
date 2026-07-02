#!/usr/bin/env node
'use strict';

/**
 * .githooks/ 配下のフックを .git/hooks/ に導入する。
 * npm install 時（postinstall）と `npm run setup` から呼ばれる。
 * .git が無い環境（CI の一部など）では何もしない。
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, '.githooks');
const gitDir = path.join(root, '.git');
const destDir = path.join(gitDir, 'hooks');

if (!fs.existsSync(gitDir) || !fs.existsSync(srcDir)) {
  process.exit(0);
}

for (const name of fs.readdirSync(srcDir)) {
  const src = path.join(srcDir, name);
  const dest = path.join(destDir, name);
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, 0o755);
  console.log(`hook を導入しました: ${name}`);
}
