#!/usr/bin/env node

/**
 * watch-resume.mjs — Watch resume template + override, re-generate PDF on save.
 *
 * Usage: pnpm watch:resume <output.pdf> [--variant default|growth|product] [--override <override.json>]
 *
 * Same args as `pnpm resume`. Auto-watches templates/resume.typ, templates/icons/*.svg,
 * and the override file (if specified).
 */

import { watch } from 'fs';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(`
Usage: pnpm watch:resume <output.pdf> [options]

Options:
  --variant=default|growth|product   Portfolio variant (default: default)
  --override=<path>                  Override JSON for subtitle/summary/bullets

Watches templates/resume.typ, templates/icons/*.svg, and override file for changes.
Re-runs pnpm resume on save.
`);
  process.exit(1);
}

const cmd = 'pnpm';
const cmdArgs = ['resume', ...args];
const cwd = __dirname;

let timeout = null;
let running = false;

function build() {
  if (running) {
    // Debounce: if a build is running, schedule another
    clearTimeout(timeout);
    timeout = setTimeout(build, 300);
    return;
  }

  clearTimeout(timeout);
  running = true;

  const start = Date.now();
  const child = spawn(cmd, cmdArgs, { cwd, stdio: 'inherit', shell: true });

  child.on('close', (code) => {
    running = false;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (code === 0) {
      console.log(`\n✅ Rebuilt in ${elapsed}s — watching for changes...\n`);
    } else {
      console.log(`\n❌ Build failed (code ${code}) in ${elapsed}s — fix and save again.\n`);
    }
  });
}

// Parse override path
const overrideFlagIdx = args.findIndex(a => a.startsWith('--override='));
let overridePath = null;
if (overrideFlagIdx !== -1) {
  overridePath = resolve(__dirname, args[overrideFlagIdx].split('=')[1]);
}

// Files to watch
const watchPaths = [resolve(__dirname, 'templates/resume.typ')];
if (overridePath && existsSync(overridePath)) {
  watchPaths.push(overridePath);
}
// Can't watch glob with fs.watch, but we can watch the icons dir
const iconsDir = resolve(__dirname, 'templates/icons');
if (existsSync(iconsDir)) {
  watchPaths.push(iconsDir);
}

console.log(`👀 Watching for changes...`);
watchPaths.forEach(p => console.log(`   ${p}`));
console.log(`\n📋 Command: ${cmd} ${cmdArgs.join(' ')}\n`);

// Initial build
build();

// Watch each path
const watchers = watchPaths.map(p => {
  try {
    return watch(p, { recursive: p === iconsDir }, (eventType, filename) => {
      if (filename) {
        console.log(`📝 Changed: ${filename}`);
      }
      build();
    });
  } catch (e) {
    console.warn(`⚠️  Cannot watch ${p}: ${e.message}`);
    return null;
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  watchers.forEach(w => w && w.close());
  process.exit(0);
});
