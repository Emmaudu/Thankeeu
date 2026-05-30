#!/usr/bin/env node
'use strict';

// ─── Thankeeu Test Runner ─────────────────────────────────────────────────────
// Runs all unit + integration tests using Node 22's built-in test runner.
// Usage: node tests/run-all.js

const { run }  = require('node:test');
const reporter = require('node:test/reporters');
const path     = require('node:path');
const fs       = require('node:fs');

const UNIT_DIR  = path.join(__dirname, 'unit');
const INT_DIR   = path.join(__dirname, 'integration');

const unitFiles = fs.readdirSync(UNIT_DIR)
  .filter(f => f.endsWith('.test.js'))
  .map(f => path.join(UNIT_DIR, f));

const intFiles = fs.readdirSync(INT_DIR)
  .filter(f => f.endsWith('.test.js'))
  .map(f => path.join(INT_DIR, f));

const allFiles = [...unitFiles, ...intFiles];

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║           THANKEEU TEST SUITE                            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log(`Running ${allFiles.length} test files:\n`);
allFiles.forEach(f => console.log(`  📄 ${path.relative(process.cwd(), f)}`));
console.log('');

const stream = run({
  files: allFiles,
  concurrency: 1,
  timeout: 30000,
});

let passed = 0, failed = 0, skipped = 0;
const failures = [];

stream.on('test:pass', (e) => {
  passed++;
  process.stdout.write(`  ✅ ${e.name}\n`);
});

stream.on('test:fail', (e) => {
  failed++;
  failures.push({ name: e.name, error: e.details?.error });
  process.stdout.write(`  ❌ ${e.name}\n`);
  if (e.details?.error?.message) {
    process.stdout.write(`     → ${e.details.error.message}\n`);
  }
});

stream.on('test:skip', (e) => {
  skipped++;
  process.stdout.write(`  ⏭️  ${e.name} (skipped)\n`);
});

stream.on('test:diagnostic', () => {});

stream.once('end', () => {
  const total = passed + failed + skipped;
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  TEST RESULTS SUMMARY');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total:   ${total}`);
  console.log(`  ✅ Pass:  ${passed}`);
  console.log(`  ❌ Fail:  ${failed}`);
  console.log(`  ⏭️  Skip:  ${skipped}`);
  console.log(`  Pass rate: ${total > 0 ? ((passed/total)*100).toFixed(1) : 0}%`);

  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    failures.forEach((f, i) => {
      console.log(`  ${i+1}. ${f.name}`);
      if (f.error?.message) console.log(`     ${f.error.message}`);
    });
  }

  console.log('══════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    console.log('  🎉 All tests passed! Thankeeu is production ready.\n');
  }
});

stream.resume();
