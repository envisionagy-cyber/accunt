import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
if (!inline.length) throw new Error('No inline application script found.');
const temp = path.join(os.tmpdir(), 'envision-inline-check.js');
fs.writeFileSync(temp, inline.join('\n;\n'));
const syntax = spawnSync(process.execPath, ['--check', temp], { encoding: 'utf8' });
fs.rmSync(temp, { force: true });
if (syntax.status !== 0) throw new Error('Frontend syntax failed:\n' + syntax.stderr);

const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
const refs = new Set([...inline.join('\n').matchAll(/\$\(["']([^"']+)["']\)/g)].map(m => m[1]));
const missing = [...refs].filter(id => !ids.has(id));
if (missing.length) throw new Error('Missing HTML IDs: ' + missing.join(', '));

const schema = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
for (const table of ['profiles','company_settings','clients','projects','invoices','payments','expenses','reminder_logs','audit_events']) {
  if (!new RegExp('create table if not exists public\\.' + table + '\\b', 'i').test(schema)) {
    throw new Error('Schema missing table: ' + table);
  }
}
console.log('Frontend JS syntax: PASS');
console.log('DOM references: PASS (' + refs.size + ' IDs, 0 missing)');
console.log('Supabase schema tables: PASS (9 tables)');
