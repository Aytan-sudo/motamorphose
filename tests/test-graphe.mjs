import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { construireGraphe, differeDuneLettre, composantes } from '../js/graphe.js';
import { distance, cheminsOptimaux, prochainOptimal } from '../js/bfs.js';
import { paireValide, choisirPaire } from '../js/paires.js';
import { creerHasard } from '../js/hasard.js';

assert.equal(differeDuneLettre('poule', 'boule'), true);
assert.equal(differeDuneLettre('poule', 'balle'), false);
const petit = construireGraphe(['poule','boule','coule','boule','bouge'].filter((m, i, a) => a.indexOf(m) === i));
assert.equal(distance(petit.voisins, 'poule', 'bouge'), 2);
assert.equal(prochainOptimal(petit.voisins, 'poule', 'bouge'), 'boule');
assert.equal(cheminsOptimaux(petit.voisins, 'poule', 'bouge').length, 1);

for (const lettres of [4, 5, 6]) {
  const donnees = JSON.parse(await readFile(new URL(`../js/data/mots${lettres}.json`, import.meta.url)));
  const mots = donnees.mots.map(e => e[0]);
  const communs = new Set(donnees.mots.filter(e => e[2]).map(e => e[0]));
  const graphe = construireGraphe(mots);
  assert.ok(graphe.dureeMs < 100, `construction ${lettres} trop lente : ${graphe.dureeMs} ms`);
  assert.ok(composantes(graphe.voisins)[0].length > 1000);
  for (const distanceVisee of [4, 5, 6]) {
    const paire = choisirPaire(graphe.voisins, communs, distanceVisee, creerHasard(`test:${lettres}:${distanceVisee}`), 3000);
    assert.equal(paireValide(graphe.voisins, communs, paire.depart, paire.cible, distanceVisee), true);
  }
  console.log(`✓ graphe ${lettres} lettres (${mots.length} mots, ${graphe.dureeMs.toFixed(1)} ms)`);
}
