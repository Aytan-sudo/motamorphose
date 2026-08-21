import { construireGraphe } from './graphe.js';
import { creerHasard } from './hasard.js';
import { choisirPaire, DISTANCES } from './paires.js';
import { creerPartie, validerMot, annuler, demanderIndice, score, MAX_INDICES } from './partie.js';
import { defiDuJour, partager } from './defi.js';
import { charger, enregistrer, seriePour } from './records.js';
import { THEMES, themeInitial } from './themes.js';
import { afficherChemin, afficherCible } from './render.js';

const VERSION = '1.1.1';
const $ = id => document.getElementById(id);
const elements = {
  chemin: $('chemin'), cible: $('mot-cible'), formulaire: $('formulaire-mot'), saisie: $('saisie-mot'),
  erreur: $('erreur'), annuler: $('annuler'), indice: $('indice'), nouveau: $('nouveau'),
  difficulte: $('difficulte'), modeJour: $('mode-jour'), modeLibre: $('mode-libre'),
  statut: $('statut'), resultat: $('resultat'), resume: $('resume'), partage: $('partage'),
  recommencer: $('recommencer'), options: $('options'), dialogueOptions: $('dialogue-options'),
  fermerOptions: $('fermer-options'), longueur: $('longueur'), choixTheme: $('choix-theme'), version: $('version'),
  apropos: $('apropos'), dialogueApropos: $('dialogue-apropos'), fermerApropos: $('fermer-apropos'),
  tempsGraphe: $('temps-graphe'), serie: $('serie'), carte: $('carte-jeu')
};

const cachesDictionnaires = new Map();
let donnees, graphe, communs, affichages, partie, mode = 'jour';
let record = charger();
let longueur = Number(localStorage.getItem('motamorphose:longueur'));
if (![4, 5, 6].includes(longueur)) longueur = 5;
let theme = themeInitial();
document.documentElement.dataset.theme = theme;
elements.longueur.value = String(longueur);
elements.version.textContent = `Version ${VERSION}`;
const NOMS_THEMES = { papier: 'Papier', nuit: 'Nuit', contraste: 'Contraste', ocean: 'Océan', foret: 'Forêt', bonbon: 'Bonbon' };
for (const nom of THEMES) elements.choixTheme.add(new Option(NOMS_THEMES[nom], nom));
elements.choixTheme.value = theme;

async function chargerDictionnaire(nouvelleLongueur) {
  if (!cachesDictionnaires.has(nouvelleLongueur)) {
    const reponse = await fetch(`./js/data/mots${nouvelleLongueur}.json`);
    if (!reponse.ok) throw new Error(`dictionnaire ${nouvelleLongueur} lettres indisponible`);
    const brut = await reponse.json();
    const entrees = brut.mots.map(([mot, affiche, commun]) => ({ mot, affiche: affiche || mot, commun: Boolean(commun) }));
    const affichagesLocaux = new Map(entrees.map(entree => [entree.mot, entree.affiche]));
    const debut = performance.now();
    const grapheLocal = construireGraphe([...affichagesLocaux.keys()]);
    cachesDictionnaires.set(nouvelleLongueur, {
      donnees: brut,
      affichages: affichagesLocaux,
      communs: new Set(entrees.filter(entree => entree.commun).map(entree => entree.mot)),
      graphe: grapheLocal,
      dureeMs: performance.now() - debut
    });
  }
  longueur = nouvelleLongueur;
  ({ donnees, affichages, communs, graphe } = cachesDictionnaires.get(longueur));
  localStorage.setItem('motamorphose:longueur', String(longueur));
  elements.saisie.maxLength = longueur;
  elements.serie.textContent = seriePour(record, longueur);
  elements.tempsGraphe.textContent = `${cachesDictionnaires.get(longueur).dureeMs.toFixed(1)} ms`;
}

function rendre(message = '') {
  afficherChemin(elements.chemin, partie, affichages);
  afficherCible(elements.cible, partie.cible, affichages);
  elements.erreur.textContent = message;
  elements.annuler.disabled = partie.chemin.length <= 1 || partie.terminee;
  elements.indice.disabled = partie.terminee || partie.indices >= MAX_INDICES;
  elements.indice.textContent = `💡 Indice (${MAX_INDICES - partie.indices})`;
  elements.statut.textContent = `${partie.chemin.length - 1} étape${partie.chemin.length > 2 ? 's' : ''}`;
  elements.carte.setAttribute('aria-label', `Partie de ${longueur} lettres`);
  if (partie.terminee) finir();
}

function nouvellePartie(type = mode) {
  mode = type;
  const paire = type === 'jour'
    ? defiDuJour(graphe.voisins, communs, longueur)
    : { ...choisirPaire(graphe.voisins, communs, DISTANCES[elements.difficulte.value], creerHasard(`${Date.now()}:${longueur}:${elements.difficulte.value}`)), mode: 'libre' };
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
  elements.resume.textContent = `Trouvé en ${etapes}, optimal ${partie.optimal} · ${partie.indices} indice${partie.indices > 1 ? 's' : ''} · ${partie.retours} retour${partie.retours > 1 ? 's' : ''} · score ${score(partie)}.`;
  if (partie.mode === 'jour' && partie.jour) {
    record = enregistrer(record, partie, partie.jour);
    elements.serie.textContent = seriePour(record, longueur);
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
  rendre(resultat.mot ? `Indice : essaie « ${affichages.get(resultat.mot) || resultat.mot} ».` : resultat.limite ? 'Les deux indices ont déjà été utilisés.' : 'Aucun chemin trouvé.');
});
elements.nouveau.addEventListener('click', () => nouvellePartie('libre'));
elements.modeJour.addEventListener('click', () => nouvellePartie('jour'));
elements.modeLibre.addEventListener('click', () => nouvellePartie('libre'));
elements.recommencer.addEventListener('click', () => nouvellePartie(mode));
elements.partage.addEventListener('click', async () => {
  const texte = partager(partie, partie.mode === 'jour' ? partie.jour : null);
  try { if (navigator.share) await navigator.share({ text: texte }); else { await navigator.clipboard.writeText(texte); elements.partage.textContent = 'Copié !'; } }
  catch (erreur) { if (erreur.name !== 'AbortError') elements.resume.textContent += ' Copie impossible.'; }
});
elements.options.addEventListener('click', () => elements.dialogueOptions.showModal());
elements.fermerOptions.addEventListener('click', () => elements.dialogueOptions.close());
elements.choixTheme.addEventListener('change', () => {
  theme = elements.choixTheme.value; document.documentElement.dataset.theme = theme;
  localStorage.setItem('motamorphose:theme', theme);
});
elements.longueur.addEventListener('change', async () => {
  elements.erreur.textContent = 'Chargement du dictionnaire…';
  await chargerDictionnaire(Number(elements.longueur.value));
  nouvellePartie(mode); elements.dialogueOptions.close();
});
elements.apropos.addEventListener('click', () => elements.dialogueApropos.showModal());
elements.fermerApropos.addEventListener('click', () => elements.dialogueApropos.close());

async function demarrer() {
  await chargerDictionnaire(longueur);
  nouvellePartie('jour');
}

demarrer().catch(erreur => { elements.erreur.textContent = `Le jeu n’a pas pu démarrer : ${erreur.message}`; });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
