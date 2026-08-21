#!/usr/bin/env node
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const options = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [cle, valeur = 'true'] = arg.replace(/^--/, '').split('=');
  return [cle, valeur];
}));
const longueur = Number(options.longueur || 5);
const source = resolve(RACINE, options.source || 'donnees-source/Lexique400.tsv');
const sortie = resolve(RACINE, options.sortie || `js/data/mots${longueur}.json`);
const seuilAccepte = Number(options['seuil-accepte'] || 50);
const seuilCommun = Number(options['seuil-commun'] || 95);
const frequenceSecours = Number(options['frequence-secours'] || 3);

// Lexique 4 ne marque pas les noms propres. Cette liste prudente ne contient que
// des formes notoirement propres rencontrées pendant l'audit des mots de 5 lettres.
const NOMS_PROPRES = new Set([
  'alice','alpes','andre','arabe','arden','aries','aster','athos','babel','bacon',
  'bambi','berne','bible','boeing','braun','breizh','brest','bruno','cain','calvi',
  'cannes','carla','celte','cesar','chili','chine','chloe','cluny','coran','corse',
  'dakar','dante','darwin','david','denis','dijon','doubs','drake','dubai','edgar',
  'elise','elvis','emile','erika','ernest','ethan','fjord','flore','franc','gabri',
  'gaule','genes','giono','gitan','hanoi','henri','herve','hindi','homer','hugo',
  'ibiza','indes','indus','islam','japon','jesus','judas','jules','julie','kabul',
  'kafka','kenya','lille','louis','lucie','maori','marie','marne','medee','milan',
  'moise','monet','nancy','naomi','nepal','niger','nimes','nobel','nolan','norve',
  'oscar','paris','pascal','perou','pierre','prada','priam','qatar','reims','rhone',
  'romeo','rouen','saone','sarah','sparte','syrie','tahiti','tibet','titus','tokyo',
  'tunis','urss','venus','vichy','vienne','virgile','volvo','yemen','zelda','zola'
]);

function normaliser(mot) {
  return mot.toLocaleLowerCase('fr-FR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
}

function nombre(valeur) {
  const n = Number(String(valeur || '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function graineAleatoire(graine) {
  let etat = graine >>> 0;
  return () => {
    etat += 0x6d2b79f5;
    let t = etat;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function voisinsParSeaux(mots) {
  const seaux = new Map();
  for (const mot of mots) for (let i = 0; i < mot.length; i += 1) {
    const cle = `${mot.slice(0, i)}_${mot.slice(i + 1)}`;
    if (!seaux.has(cle)) seaux.set(cle, []);
    seaux.get(cle).push(mot);
  }
  const voisins = new Map(mots.map(m => [m, new Set()]));
  for (const groupe of seaux.values()) for (const a of groupe) for (const b of groupe) {
    if (a !== b) voisins.get(a).add(b);
  }
  return voisins;
}

const texte = await readFile(source, 'utf8');
const lignes = texte.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
const entetes = lignes.shift().split('\t');
const index = Object.fromEntries(entetes.map((nom, i) => [nom.replace(/^\d+_/, ''), i]));
for (const champ of ['Mot','Lemme','Cgram','CgramOrtho','FreqOrtho','IsLem','NbLettres','Preval']) {
  if (!(champ in index)) throw new Error(`Colonne Lexique absente : ${champ}`);
}

const compte = { source: lignes.length, longueur: 0, caracteres: 0, categorie: 0, propres: 0, familiarite: 0, doublons: 0 };
const candidats = new Map();
for (const ligne of lignes) {
  const c = ligne.split('\t');
  if (Number(c[index.NbLettres]) !== longueur) continue;
  compte.longueur += 1;
  const affiche = c[index.Mot].toLocaleLowerCase('fr-FR');
  const mot = normaliser(affiche);
  if (!/^[a-z]+$/.test(mot) || mot.length !== longueur) continue;
  compte.caracteres += 1;
  const categories = c[index.CgramOrtho].split(',');
  const estNomOuAdj = categories.includes('NOM') || categories.includes('ADJ');
  const estInfinitif = categories.includes('VER') && c[index.IsLem] === '1' && normaliser(c[index.Lemme]) === mot;
  if (!estNomOuAdj && !estInfinitif) continue;
  compte.categorie += 1;
  if (NOMS_PROPRES.has(mot)) continue;
  compte.propres += 1;
  const prevalence = nombre(c[index.Preval]);
  const frequence = nombre(c[index.FreqOrtho]) || 0;
  if (!((prevalence !== null && prevalence >= seuilAccepte) || (prevalence === null && frequence >= frequenceSecours))) continue;
  compte.familiarite += 1;
  // Une forme aussi étiquetée VER n'entre dans le cercle commun que si cette
  // forme est l'infinitif. Elle reste acceptée comme nom/adjectif éventuel.
  const commun = prevalence !== null && prevalence >= seuilCommun && (!categories.includes('VER') || estInfinitif);
  const entree = { mot, affiche, frequence, prevalence: prevalence ?? 0, commun };
  const actuelle = candidats.get(mot);
  if (!actuelle || entree.frequence > actuelle.frequence) candidats.set(mot, entree);
  else compte.doublons += 1;
}

const entrees = [...candidats.values()].sort((a, b) => a.mot.localeCompare(b.mot, 'fr'));
const fichier = { version: 1, longueur, source: 'Lexique 4.00', seuils: { accepte: seuilAccepte, commun: seuilCommun, frequenceSecours }, mots: entrees };
await mkdir(dirname(sortie), { recursive: true });
await writeFile(sortie, `${JSON.stringify(fichier)}\n`);
const poids = (await stat(sortie)).size;
if (poids > 300_000) throw new Error(`Le dictionnaire pèse ${poids} octets (> 300 Ko).`);

const voisins = voisinsParSeaux(entrees.map(e => e.mot));
let isoles = 0;
let plusGrande = 0;
const vus = new Set();
for (const mot of voisins.keys()) {
  if (voisins.get(mot).size === 0) isoles += 1;
  if (vus.has(mot)) continue;
  let taille = 0;
  const pile = [mot];
  vus.add(mot);
  while (pile.length) {
    const courant = pile.pop(); taille += 1;
    for (const voisin of voisins.get(courant)) if (!vus.has(voisin)) { vus.add(voisin); pile.push(voisin); }
  }
  plusGrande = Math.max(plusGrande, taille);
}

const communs = entrees.filter(e => e.commun);
const hasard = graineAleatoire(0x4d4f5453);
const echantillon = [...communs].sort(() => hasard() - 0.5).slice(0, 50).map(e => e.affiche);
console.log(JSON.stringify({ ...compte, acceptes: entrees.length, communs: communs.length, plusGrandeComposante: plusGrande, isoles, octets: poids }, null, 2));
console.log(`\n50 mots communs (tirage reproductible) :\n${echantillon.join(', ')}`);
