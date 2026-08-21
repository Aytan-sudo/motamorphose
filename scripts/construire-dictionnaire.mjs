#!/usr/bin/env node
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const options = Object.fromEntries(process.argv.slice(2).map(argument => {
  const [cle, valeur = 'true'] = argument.replace(/^--/, '').split('=');
  return [cle, valeur];
}));
const longueurs = (options.longueurs || options.longueur || '4,5,6').split(',').map(Number);
const seuilAccepte = Number(options['seuil-accepte'] || 50);
const seuilCommun = Number(options['seuil-commun'] || 95);
const frequenceSecours = Number(options['frequence-secours'] || 0.1);
const sources = {
  lexique: resolve(RACINE, options.lexique || 'donnees-source/Lexique400.tsv'),
  morphalouNoms: resolve(RACINE, options['morphalou-noms'] || 'donnees-source/commonNoun_Morphalou3.1_CSV.csv'),
  morphalouAdjectifs: resolve(RACINE, options['morphalou-adjectifs'] || 'donnees-source/adjective_Morphalou3.1_CSV.csv'),
  morphalouVerbes: resolve(RACINE, options['morphalou-verbes'] || 'donnees-source/verb_Morphalou3.1_CSV.csv'),
  grammalecte: resolve(RACINE, options.grammalecte || 'donnees-source/lexique-grammalecte-fr-v7.7.txt')
};

const NOMS_PROPRES = new Set([
  'alice','alpes','andre','arabe','arden','aries','aster','athos','babel','bacon','bambi','berne','bible','boeing','braun','breizh','brest','bruno','cain','calvi','cannes','carla','celte','cesar','chili','chine','chloe','cluny','coran','corse','dakar','dante','darwin','david','denis','dijon','doubs','drake','dubai','edgar','elise','elvis','emile','erika','ernest','ethan','fjord','flore','franc','gabri','gaule','genes','giono','gitan','hanoi','henri','herve','hindi','homer','hugo','ibiza','indes','indus','islam','japon','jesus','judas','jules','julie','kabul','kafka','kenya','lille','louis','lucie','maori','marie','marne','medee','milan','moise','monet','nancy','naomi','nepal','niger','nimes','nobel','nolan','oscar','paris','pascal','perou','pierre','prada','priam','qatar','reims','rhone','romeo','rouen','saone','sarah','sparte','syrie','tahiti','tibet','titus','tokyo','tunis','urss','venus','vichy','vienne','virgile','volvo','yemen','zelda','zola'
]);
const EXCLUSIONS_COMMUNES = new Set([
  'bite','bites','chier','couille','foutre','merde','niquer','nique','porno','putain','salope'
]);

const parLongueur = new Map(longueurs.map(longueur => [longueur, new Map()]));
const statistiques = Object.fromEntries(longueurs.map(longueur => [longueur, { lexique: 0, morphalou: 0, grammalecte: 0 }]));

function normaliser(mot) {
  return String(mot || '').trim().toLocaleLowerCase('fr-FR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
}

function nombre(valeur) {
  const texte = String(valeur ?? '').trim();
  if (!texte) return null;
  const resultat = Number(texte.replace(',', '.'));
  return Number.isFinite(resultat) ? resultat : null;
}

function ajouter(affiche, source, informations = {}) {
  affiche = String(affiche || '').trim().toLocaleLowerCase('fr-FR');
  const mot = normaliser(affiche), longueur = mot.length;
  if (!parLongueur.has(longueur) || !/^[a-z]+$/.test(mot) || NOMS_PROPRES.has(mot)) return;
  const table = parLongueur.get(longueur);
  const actuelle = table.get(mot) || { mot, affiche, frequence: -Infinity, commun: false, sources: new Set() };
  actuelle.sources.add(source);
  if ((informations.frequence ?? -Infinity) > actuelle.frequence || actuelle.affiche === mot) {
    actuelle.affiche = affiche;
    actuelle.frequence = informations.frequence ?? actuelle.frequence;
  }
  actuelle.commun ||= Boolean(informations.commun);
  actuelle.ambiguVerbe ||= Boolean(informations.ambiguVerbe);
  actuelle.lexiqueEligible ||= Boolean(informations.lexiqueEligible);
  table.set(mot, actuelle);
  statistiques[longueur][source] += 1;
}

async function lireLexique() {
  const lignes = (await readFile(sources.lexique, 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const entetes = lignes.shift().split('\t');
  const index = Object.fromEntries(entetes.map((nom, i) => [nom.replace(/^\d+_/, ''), i]));
  for (const champ of ['Mot','Lemme','CgramOrtho','FreqOrtho','IsLem','NbLettres','Preval']) if (!(champ in index)) throw new Error(`Colonne Lexique absente : ${champ}`);
  for (const ligne of lignes) {
    const c = ligne.split('\t');
    if (!parLongueur.has(Number(c[index.NbLettres]))) continue;
    const mot = normaliser(c[index.Mot]), categories = c[index.CgramOrtho].split(',');
    const estInfinitif = categories.includes('VER') && c[index.IsLem] === '1' && normaliser(c[index.Lemme]) === mot;
    if (!categories.includes('NOM') && !categories.includes('ADJ') && !estInfinitif) continue;
    const prevalence = nombre(c[index.Preval]), frequence = nombre(c[index.FreqOrtho]) || 0;
    ajouter(c[index.Mot], 'lexique', {
      frequence,
      lexiqueEligible: (prevalence !== null && prevalence >= seuilAccepte) || (prevalence === null && frequence >= frequenceSecours),
      commun: prevalence !== null && prevalence >= seuilCommun,
      ambiguVerbe: categories.includes('VER') && !estInfinitif
    });
  }
}

async function lireMorphalou(fichier, verbes = false) {
  const lignes = (await readFile(fichier, 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/);
  let commence = false;
  for (const ligne of lignes) {
    if (!commence) { if (ligne.startsWith('GRAPHIE;ID;CATÉGORIE;')) commence = true; continue; }
    const c = ligne.split(';');
    if (verbes) { if (c[0]) ajouter(c[0], 'morphalou'); }
    else if (c[9]) ajouter(c[9], 'morphalou');
  }
}

async function lireGrammalecte() {
  const lignes = (await readFile(sources.grammalecte, 'utf8')).split(/\r?\n/);
  for (const ligne of lignes) {
    if (!ligne || ligne.startsWith('#') || !/^\d+\t/.test(ligne)) continue;
    const c = ligne.split('\t'), flexion = c[2], lemme = c[3], etiquettes = c[4] || '';
    const nomOuAdjectif = /^(nom|adj)\b/.test(etiquettes);
    const infinitif = /\binfi\b/.test(etiquettes) && normaliser(flexion) === normaliser(lemme);
    if (nomOuAdjectif || infinitif) ajouter(flexion, 'grammalecte');
  }
}

function construireGraphe(mots) {
  const seaux = new Map(), voisins = new Map(mots.map(mot => [mot, new Set()]));
  for (const mot of mots) for (let i = 0; i < mot.length; i += 1) {
    const cle = `${mot.slice(0, i)}_${mot.slice(i + 1)}`;
    if (!seaux.has(cle)) seaux.set(cle, []);
    seaux.get(cle).push(mot);
  }
  for (const groupe of seaux.values()) for (let i = 0; i < groupe.length; i += 1) for (let j = i + 1; j < groupe.length; j += 1) {
    voisins.get(groupe[i]).add(groupe[j]); voisins.get(groupe[j]).add(groupe[i]);
  }
  return voisins;
}

function statsGraphe(mots) {
  const graphe = construireGraphe(mots), vus = new Set();
  let plusGrandeComposante = 0, isoles = 0;
  for (const [mot, voisins] of graphe) {
    if (!voisins.size) isoles += 1;
    if (vus.has(mot)) continue;
    let taille = 0; const pile = [mot]; vus.add(mot);
    while (pile.length) { const courant = pile.pop(); taille += 1; for (const voisin of graphe.get(courant)) if (!vus.has(voisin)) { vus.add(voisin); pile.push(voisin); } }
    plusGrandeComposante = Math.max(plusGrandeComposante, taille);
  }
  return { plusGrandeComposante, isoles };
}

await Promise.all([
  lireLexique(), lireMorphalou(sources.morphalouNoms), lireMorphalou(sources.morphalouAdjectifs),
  lireMorphalou(sources.morphalouVerbes, true), lireGrammalecte()
]);

await mkdir(resolve(RACINE, 'js/data'), { recursive: true });
for (const longueur of longueurs) {
  const candidats = [...parLongueur.get(longueur).values()];
  const acceptes = candidats.filter(entree => entree.lexiqueEligible || entree.sources.size >= 2).sort((a, b) => a.mot.localeCompare(b.mot, 'fr'));
  const estCommun = entree => entree.commun && !entree.ambiguVerbe && !EXCLUSIONS_COMMUNES.has(entree.mot);
  const mots = acceptes.map(entree => [entree.mot, entree.affiche === entree.mot ? '' : entree.affiche, estCommun(entree) ? 1 : 0]);
  const sortie = resolve(RACINE, `js/data/mots${longueur}.json`);
  await writeFile(sortie, `${JSON.stringify({ version: 2, longueur, sources: ['Lexique 4.00','Morphalou 3.1','Grammalecte 7.7'], mots })}\n`);
  const octets = (await stat(sortie)).size;
  console.log(JSON.stringify({ longueur, candidats: candidats.length, acceptes: acceptes.length, communs: acceptes.filter(estCommun).length, ...statsGraphe(acceptes.map(e => e.mot)), octets, occurrencesSources: statistiques[longueur] }, null, 2));
}
