import { composantes } from './graphe.js';
import { distance, distances, cheminsOptimaux } from './bfs.js';
import { choisir } from './hasard.js';

export const DISTANCES = { facile: 4, moyen: 5, difficile: 6 };

export function paireValide(graphe, communs, depart, cible, longueur) {
  if (depart === cible || !communs.has(depart) || !communs.has(cible)) return false;
  if (distance(graphe, depart, cible) !== longueur) return false;
  if (distance(graphe, depart, cible, communs) !== longueur) return false;
  const chemins = cheminsOptimaux(graphe, depart, cible, communs, 3);
  // Deux solutions optimales garantissent au moins une vraie bifurcation.
  return chemins.length >= 2;
}

export function choisirPaire(graphe, communs, longueur, hasard, essais = 1200) {
  const grande = new Set(composantes(graphe)[0] || []);
  const candidats = [...communs].filter(m => grande.has(m));
  for (let i = 0; i < Math.min(essais, 300); i += 1) {
    const depart = choisir(candidats, hasard);
    const d = distances(graphe, depart);
    const cibles = candidats.filter(m => d.get(m) === longueur);
    // Le mélange déterministe évite de privilégier l'ordre alphabétique.
    for (let j = 0; j < Math.min(cibles.length, 30); j += 1) {
      const position = Math.floor(hasard() * cibles.length);
      const [cible] = cibles.splice(position, 1);
      if (paireValide(graphe, communs, depart, cible, longueur)) return { depart, cible, optimal: longueur };
    }
  }
  throw new Error(`Aucune paire accessible trouvée à distance ${longueur}.`);
}
