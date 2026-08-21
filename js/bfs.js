export function distances(graphe, depart, autorises = null) {
  const d = new Map([[depart, 0]]), file = [depart];
  for (let i = 0; i < file.length; i += 1) {
    const mot = file[i];
    for (const voisin of graphe.get(mot) || []) if (!d.has(voisin) && (!autorises || autorises.has(voisin))) {
      d.set(voisin, d.get(mot) + 1); file.push(voisin);
    }
  }
  return d;
}

export function distance(graphe, depart, arrivee, autorises = null) {
  return distances(graphe, depart, autorises).get(arrivee) ?? Infinity;
}

export function prochainOptimal(graphe, courant, cible, autorises = null) {
  const versCible = distances(graphe, cible, autorises);
  return [...(graphe.get(courant) || [])]
    .filter(m => !autorises || autorises.has(m))
    .sort((a, b) => (versCible.get(a) ?? Infinity) - (versCible.get(b) ?? Infinity) || a.localeCompare(b))[0] || null;
}

export function cheminsOptimaux(graphe, depart, arrivee, autorises = null, limite = 500) {
  const depuisDepart = distances(graphe, depart, autorises);
  const versArrivee = distances(graphe, arrivee, autorises);
  const optimal = depuisDepart.get(arrivee);
  if (optimal === undefined) return [];
  const resultat = [];
  function visiter(mot, chemin) {
    if (resultat.length >= limite) return;
    if (mot === arrivee) { resultat.push(chemin); return; }
    for (const voisin of graphe.get(mot) || []) if (
      depuisDepart.get(voisin) === depuisDepart.get(mot) + 1 &&
      depuisDepart.get(voisin) + versArrivee.get(voisin) === optimal
    ) visiter(voisin, [...chemin, voisin]);
  }
  visiter(depart, [depart]);
  return resultat;
}

