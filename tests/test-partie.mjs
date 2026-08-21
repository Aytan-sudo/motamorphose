import assert from 'node:assert/strict';
import { creerPartie, validerMot, annuler, demanderIndice } from '../js/partie.js';
import { construireGraphe } from '../js/graphe.js';

const mots = new Map(['poule','boule','bouge','rouge'].map(m => [m, m]));
let partie = creerPartie({ depart: 'poule', cible: 'rouge', optimal: 3 });
assert.match(validerMot(partie, 'chat', mots).erreur, /exactement 5/);
assert.match(validerMot(partie, 'table', mots).erreur, /dictionnaire/);
assert.match(validerMot(partie, 'rouge', mots).erreur, /une seule lettre/);
partie = validerMot(partie, 'Boulé', mots).partie;
assert.deepEqual(partie.chemin, ['poule','boule']);
partie = annuler(partie);
assert.deepEqual(partie.chemin, ['poule']);
const graphe = construireGraphe([...mots.keys()]);
const indice = demanderIndice(partie, graphe.voisins);
assert.equal(indice.mot, 'boule');
assert.equal(indice.partie.indices, 1);
console.log('✓ partie et validations');

