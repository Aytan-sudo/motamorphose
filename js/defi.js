import { creerHasard } from './hasard.js';
import { choisirPaire } from './paires.js';

export function dateLocale(date = new Date()) {
  const annee = date.getFullYear();
  return `${annee}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function defiDuJour(graphe, communs, longueur, date = new Date()) {
  const jour = dateLocale(date);
  return { ...choisirPaire(graphe, communs, 5, creerHasard(`mots${longueur}-v2:${jour}`)), jour, mode: 'jour' };
}

export function partager(partie, jour = null) {
  const coups = partie.chemin.length - 1;
  const ligne = Array.from({ length: coups }, (_, i) => i < partie.optimal ? '🟩' : '🟧').join('');
  return `Motamorphose · ${partie.depart.length} lettres${jour ? ` — ${jour}` : ''}\n${coups} étapes · optimal ${partie.optimal}\n${ligne}\n💡 ${partie.indices}/2 · ↶ ${partie.retours}`;
}
