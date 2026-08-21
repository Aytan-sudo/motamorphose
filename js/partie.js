import { differeDuneLettre } from './graphe.js';
import { prochainOptimal } from './bfs.js';

export function normaliserSaisie(mot) {
  return mot.trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe');
}

export function creerPartie(paire) {
  return { ...paire, chemin: [paire.depart], indices: 0, terminee: false };
}

export function validerMot(partie, saisie, dictionnaire) {
  const mot = normaliserSaisie(saisie);
  if (mot.length !== partie.depart.length) return { erreur: `Il faut exactement ${partie.depart.length} lettres.` };
  if (!dictionnaire.has(mot)) return { erreur: `« ${saisie.trim()} » n’est pas dans le dictionnaire du jeu.` };
  const courant = partie.chemin.at(-1);
  if (!differeDuneLettre(courant, mot)) return { erreur: 'Change une seule lettre par rapport au mot précédent.' };
  const chemin = [...partie.chemin, mot];
  return { partie: { ...partie, chemin, terminee: mot === partie.cible } };
}

export function annuler(partie) {
  if (partie.chemin.length <= 1 || partie.terminee) return partie;
  return { ...partie, chemin: partie.chemin.slice(0, -1) };
}

export function demanderIndice(partie, graphe) {
  if (partie.terminee) return { partie, mot: null };
  const mot = prochainOptimal(graphe, partie.chemin.at(-1), partie.cible);
  return { partie: { ...partie, indices: partie.indices + 1 }, mot };
}

export function score(partie) {
  return Math.max(0, 100 - (partie.chemin.length - 1 - partie.optimal) * 5 - partie.indices * 10);
}

