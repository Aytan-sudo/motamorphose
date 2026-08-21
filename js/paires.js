import { composantes } from './graphe.js';
import { distance, distances, cheminsOptimaux } from './bfs.js';

export const DISTANCES = { facile: 4, moyen: 5, difficile: 6 };

export function paireValide(graphe, communs, depart, cible, longueur) {
  if (depart === cible || !communs.has(depart) || !communs.has(cible)) return false;
  if (distance(graphe, depart, cible) !== longueur) return false;
  if (distance(graphe, depart, cible, communs) !== longueur) return false;
  const chemins = cheminsOptimaux(graphe, depart, cible, null, 3);
  // Une solution commune existe ci-dessus ; deux solutions acceptées évitent
  // les couloirs sans imposer que chaque variante soit ultra-familière.
  return chemins.length >= 2;
}

export function choisirPaire(graphe, communs, longueur, hasard, essais = 1200) {
  const grande = new Set(composantes(graphe)[0] || []);
  const candidats = [...communs].filter(m => grande.has(m));
  for (let i = candidats.length - 1; i > 0; i -= 1) {
    const j = Math.floor(hasard() * (i + 1));
    [candidats[i], candidats[j]] = [candidats[j], candidats[i]];
  }
  for (let i = 0; i < Math.min(essais, candidats.length); i += 1) {
    const depart = candidats[i];
    const d = distances(graphe, depart), dCommun = distances(graphe, depart, communs);
    const cibles = candidats.filter(m => d.get(m) === longueur && dCommun.get(m) === longueur);
    for (let j = 0; j < cibles.length; j += 1) {
      const position = Math.floor(hasard() * cibles.length);
      const [cible] = cibles.splice(position, 1);
      if (paireValide(graphe, communs, depart, cible, longueur)) return { depart, cible, optimal: longueur };
    }
  }
  throw new Error(`Aucune paire accessible trouvée à distance ${longueur}.`);
}
