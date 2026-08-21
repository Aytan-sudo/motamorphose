export function hacher(texte) {
  let h = 2166136261;
  for (const caractere of texte) { h ^= caractere.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function creerHasard(graine) {
  let etat = typeof graine === 'string' ? hacher(graine) : graine >>> 0;
  return () => {
    etat += 0x6d2b79f5;
    let t = etat;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function choisir(tableau, hasard) {
  return tableau[Math.floor(hasard() * tableau.length)];
}

