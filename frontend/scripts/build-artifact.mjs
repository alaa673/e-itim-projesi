/**
 * Converts the single-file demo build (dist-demo/index.html) into a page body for hosts that
 * wrap content in their own <!doctype html><head><body> skeleton (e.g. a shared preview link).
 * Keeps: <title>, the pre-paint theme script, inlined styles and the app bundle.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync(new URL('../dist-demo/index.html', import.meta.url), 'utf8');

const pick = (re) => [...source.matchAll(re)].map((m) => m[0]);
const title = source.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>PUSULA Eğitim Portalı</title>';
const styles = pick(/<style[^>]*>[\s\S]*?<\/style>/g);
const scripts = pick(/<script[^>]*>[\s\S]*?<\/script>/g);
const classicScripts = scripts.filter((s) => !/type="module"/.test(s));
const moduleScripts = scripts.filter((s) => /type="module"/.test(s));

if (moduleScripts.length === 0) throw new Error('App bundle not found in dist-demo/index.html');

const page = [
  title,
  '<meta name="description" content="PUSULA — yönetici, öğretmen ve öğrenci için eğitim portalı (demo)">',
  ...classicScripts,
  ...styles,
  '<div id="root"></div>',
  ...moduleScripts,
].join('\n');

writeFileSync(new URL('../dist-demo/akilli-egitim-portali.html', import.meta.url), page);
console.log(`dist-demo/akilli-egitim-portali.html written (${(page.length / 1024).toFixed(0)} kB)`);
