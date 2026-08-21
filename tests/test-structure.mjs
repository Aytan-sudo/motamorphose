import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const racine = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', racine), 'utf8');
const css = await readFile(new URL('css/style.css', racine), 'utf8');
const sw = await readFile(new URL('sw.js', racine), 'utf8');
const app = await readFile(new URL('js/app.js', racine), 'utf8');
const paquet = JSON.parse(await readFile(new URL('package.json', racine), 'utf8'));
assert.match(app, new RegExp(`VERSION = ['"]${paquet.version.replaceAll('.', '\\.')}['"]`));
for (const id of [...app.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1])) assert.match(html, new RegExp(`id=["']${id}["']`), `#${id} absent`);
const palettes = [...css.matchAll(/(?:^|\n)(:root(?:\[data-theme="[^"]+"\])?)\s*\{([^}]+)\}/g)].map(([, nom, bloc]) => [nom, bloc]);
const variables = bloc => new Set([...bloc.matchAll(/--([\w-]+)\s*:/g)].map(m => m[1]));
const reference = variables(palettes[0][1]);
for (const [nom, bloc] of palettes.slice(1)) assert.deepEqual(variables(bloc), reference, `palette incomplète ${nom}`);
for (const module of [...app.matchAll(/from ['"](\.\/[^'"]+)['"]/g)].map(m => m[1])) assert.match(sw, new RegExp(module.replace('./', './js/').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
for (const longueur of [4, 5, 6]) {
  const fichier = new URL(`js/data/mots${longueur}.json`, racine);
  assert.ok((await stat(fichier)).size < 300_000, `dictionnaire ${longueur} trop lourd`);
  const dictionnaire = JSON.parse(await readFile(fichier, 'utf8'));
  assert.ok(dictionnaire.mots.every(entree => entree[0].length === longueur));
  assert.match(sw, new RegExp(`mots${longueur}\\.json`));
}
const dictionnaire = JSON.parse(await readFile(new URL('js/data/mots5.json', racine), 'utf8'));
assert.ok(dictionnaire.mots.some(entree => entree[0] === 'alter'), 'ALTER doit être accepté');
assert.doesNotMatch(html, /Math\.random/); assert.doesNotMatch(app, /Math\.random/);
console.log('✓ page, palettes, cache et dictionnaire');
