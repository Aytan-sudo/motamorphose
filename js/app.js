import { construireGraphe } from './graphe.js';
import { creerHasard } from './hasard.js';
import { choisirPaire, DISTANCES } from './paires.js';
import { creerPartie, validerMot, annuler, demanderIndice, score } from './partie.js';
import { defiDuJour, partager } from './defi.js';
import { charger, enregistrer } from './records.js';
import { themeInitial, themeSuivant } from './themes.js';
import { afficherChemin, afficherCible } from './render.js';

const $ = id => document.getElementById(id);
const elements = {
  chemin: $('chemin'), cible: $('mot-cible'), formulaire: $('formulaire-mot'), saisie: $('saisie-mot'),
  erreur: $('erreur'), annuler: $('annuler'), indice: $('indice'), nouveau: $('nouveau'),
  difficulte: $('difficulte'), modeJour: $('mode-jour'), modeLibre: $('mode-libre'),
  statut: $('statut'), resultat: $('resultat'), resume: $('resume'), partage: $('partage'),
  recommencer: $('recommencer'), theme: $('theme'), apropos: $('apropos'), dialogueApropos: $('dialogue-apropos'),
  fermerApropos: $('fermer-apropos'), tempsGraphe: $('temps-graphe'), serie: $('serie')
};

let donnees, graphe, communs, affichages, partie, record = charger(), mode = 'jour';
let theme = themeInitial();
document.documentElement.dataset.theme = theme;
elements.serie.textContent = record.serie || 0;

function rendre(message = '') {
  afficherChemin(elements.chemin, partie, affichages);
  afficherCible(elements.cible, partie.cible, affichages);
  elements.erreur.textContent = message;
  elements.annuler.disabled = partie.chemin.length <= 1 || partie.terminee;
  elements.indice.disabled = partie.terminee;
  elements.statut.textContent = `${partie.chemin.length - 1} étape${partie.chemin.length > 2 ? 's' : ''}`;
  if (partie.terminee) finir();
}

function nouvellePartie(type = mode) {
  mode = type;
  const paire = type === 'jour'
    ? defiDuJour(graphe.voisins, communs)
    : { ...choisirPaire(graphe.voisins, communs, DISTANCES[elements.difficulte.value], creerHasard(`${Date.now()}:${elements.difficulte.value}`)), mode: 'libre' };
  partie = creerPartie(paire);
  elements.resultat.hidden = true;
  elements.formulaire.hidden = false;
  elements.saisie.value = '';
  elements.modeJour.setAttribute('aria-pressed', String(type === 'jour'));
  elements.modeLibre.setAttribute('aria-pressed', String(type === 'libre'));
  rendre();
  elements.saisie.focus({ preventScroll: true });
}

function finir() {
  elements.formulaire.hidden = true;
  elements.resultat.hidden = false;
  const etapes = partie.chemin.length - 1;
  elements.resume.textContent = `Trouvé en ${etapes}, l’optimal est ${partie.optimal}. Score : ${score(partie)}.`;
  if (partie.mode === 'jour' && partie.jour) {
    record = enregistrer(record, partie, partie.jour);
    elements.serie.textContent = record.serie;
  }
}

elements.formulaire.addEventListener('submit', evenement => {
  evenement.preventDefault();
  const resultat = validerMot(partie, elements.saisie.value, affichages);
  if (resultat.erreur) { rendre(resultat.erreur); elements.saisie.select(); return; }
  partie = resultat.partie; elements.saisie.value = ''; rendre();
});
elements.annuler.addEventListener('click', () => { partie = annuler(partie); rendre(); });
elements.indice.addEventListener('click', () => {
  const resultat = demanderIndice(partie, graphe.voisins); partie = resultat.partie;
  rendre(resultat.mot ? `Indice : essaie « ${affichages.get(resultat.mot) || resultat.mot} ».` : 'Aucun chemin trouvé.');
});
elements.nouveau.addEventListener('click', () => nouvellePartie('libre'));
elements.modeJour.addEventListener('click', () => nouvellePartie('jour'));
elements.modeLibre.addEventListener('click', () => nouvellePartie('libre'));
elements.recommencer.addEventListener('click', () => nouvellePartie(mode));
elements.partage.addEventListener('click', async () => {
  const texte = partager(partie, partie.mode === 'jour' ? partie.jour : null);
  try { if (navigator.share) await navigator.share({ text: texte }); else { await navigator.clipboard.writeText(texte); elements.partage.textContent = 'Copié !'; } }
  catch (erreur) { if (erreur.name !== 'AbortError') elements.resume.textContent = `${elements.resume.textContent} Copie impossible.`; }
});
elements.theme.addEventListener('click', () => { theme = themeSuivant(theme); document.documentElement.dataset.theme = theme; localStorage.setItem('motamorphose:theme', theme); });
elements.apropos.addEventListener('click', () => elements.dialogueApropos.showModal());
elements.fermerApropos.addEventListener('click', () => elements.dialogueApropos.close());

async function demarrer() {
  const reponse = await fetch('./js/data/mots5.json');
  donnees = await reponse.json();
  affichages = new Map(donnees.mots.map(e => [e.mot, e.affiche]));
  communs = new Set(donnees.mots.filter(e => e.commun).map(e => e.mot));
  graphe = construireGraphe([...affichages.keys()]);
  elements.tempsGraphe.textContent = `${graphe.dureeMs.toFixed(1)} ms`;
  nouvellePartie('jour');
}

demarrer().catch(erreur => { elements.erreur.textContent = `Le jeu n’a pas pu démarrer : ${erreur.message}`; });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
