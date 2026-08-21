import assert from 'node:assert/strict';
import { creerHasard } from '../js/hasard.js';
import { partager, dateLocale } from '../js/defi.js';
assert.deepEqual([creerHasard('stable')(), creerHasard('stable')()], [creerHasard('stable')(), creerHasard('stable')()]);
assert.equal(dateLocale(new Date(2026, 7, 21)), '2026-08-21');
const texte = partager({ chemin: ['a','b','c'], optimal: 2, indices: 1 }, '2026-08-21');
assert.match(texte, /optimal 2/); assert.doesNotMatch(texte, /\na\n|\nb\n|\nc\n/);
console.log('✓ hasard, date et partage');

