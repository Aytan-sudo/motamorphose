export function indiceDifference(avant, apres) {
  for (let i = 0; i < avant.length; i += 1) if (avant[i] !== apres[i]) return i;
  return -1;
}

export function afficherChemin(element, partie, affichages) {
  element.replaceChildren();
  element.style.setProperty('--mot-longueur', partie.depart.length);
  partie.chemin.forEach((mot, ligne) => {
    const precedent = partie.chemin[ligne - 1];
    const change = precedent ? indiceDifference(precedent, mot) : -1;
    const item = document.createElement('li');
    item.className = ligne === partie.chemin.length - 1 ? 'mot mot--actuel' : 'mot';
    item.setAttribute('aria-label', affichages.get(mot) || mot);
    for (let i = 0; i < mot.length; i += 1) {
      const lettre = document.createElement('span');
      lettre.textContent = (affichages.get(mot) || mot)[i];
      if (i === change) lettre.className = 'lettre-changee';
      item.append(lettre);
    }
    element.append(item);
  });
  element.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export function afficherCible(element, mot, affichages) {
  element.textContent = affichages.get(mot) || mot;
}
