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

const donnees = JSON.parse(await readFile(new URL('../js/data/mots5.json', import.meta.url)));
const mots = donnees.mots.map(e => e.mot);
const communs = new Set(donnees.mots.filter(e => e.commun).map(e => e.mot));
const graphe = construireGraphe(mots);
assert.ok(graphe.dureeMs < 100, `construction trop lente : ${graphe.dureeMs} ms`);
assert.ok(composantes(graphe.voisins)[0].length > 1000);
for (const longueur of [4, 5, 6]) {
  const paire = choisirPaire(graphe.voisins, communs, longueur, creerHasard(`test:${longueur}`), 3000);
  assert.equal(paireValide(graphe.voisins, communs, paire.depart, paire.cible, longueur), true);
}
console.log(`✓ graphe (${mots.length} mots, ${graphe.dureeMs.toFixed(1)} ms)`);

