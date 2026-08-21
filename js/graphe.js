export function differeDuneLettre(a, b) {
  if (a.length !== b.length) return false;
  let differences = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i] && ++differences > 1) return false;
  return differences === 1;
}

export function construireGraphe(mots) {
  const debut = globalThis.performance?.now?.() ?? Date.now();
  const voisins = new Map(mots.map(m => [m, new Set()]));
  const seaux = new Map();
  for (const mot of mots) for (let i = 0; i < mot.length; i += 1) {
    const cle = `${mot.slice(0, i)}_${mot.slice(i + 1)}`;
    if (!seaux.has(cle)) seaux.set(cle, []);
    seaux.get(cle).push(mot);
  }
  for (const groupe of seaux.values()) for (let i = 0; i < groupe.length; i += 1) {
    for (let j = i + 1; j < groupe.length; j += 1) {
      voisins.get(groupe[i]).add(groupe[j]); voisins.get(groupe[j]).add(groupe[i]);
    }
  }
  return { voisins, dureeMs: (globalThis.performance?.now?.() ?? Date.now()) - debut };
}

export function composantes(graphe) {
  const resultat = [];
  const vus = new Set();
  for (const mot of graphe.keys()) {
    if (vus.has(mot)) continue;
    const groupe = [], pile = [mot]; vus.add(mot);
    while (pile.length) { const courant = pile.pop(); groupe.push(courant); for (const v of graphe.get(courant)) if (!vus.has(v)) { vus.add(v); pile.push(v); } }
    resultat.push(groupe);
  }
  return resultat.sort((a, b) => b.length - a.length);
}

