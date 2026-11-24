// Builds static/games/rivers-galactic-playground/flash/index.html from game.js and shell.html.
// The site itself has no dependencies; this one-off build needs three@0.170.0 and esbuild somewhere:
//   mkdir /tmp/fl && cd /tmp/fl && npm i three@0.170.0 esbuild
//   FLASH_DEPS=/tmp/fl/node_modules node tools/flash-monster-truck/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const deps = process.env.FLASH_DEPS || '/tmp/fl/node_modules';
const require = createRequire(join(deps, 'x.js'));
const esbuild = require('esbuild');
const out = await esbuild.build({
  entryPoints: [join(here, 'game.js')], bundle: true, minify: true, format: 'iife', write: false,
  nodePaths: [deps], target: ['es2020'], legalComments: 'none',
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync(join(here, 'shell.html'), 'utf8').replace('/*GAME*/', () => js);
const dest = join(here, '../../static/games/rivers-galactic-playground/flash');
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, 'index.html'), html);
console.log('wrote', join(dest, 'index.html'), (html.length / 1e3).toFixed(0) + ' kB');
