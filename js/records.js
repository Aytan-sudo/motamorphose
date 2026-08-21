export const CLE_STOCKAGE = 'motamorphose:v1';

export function charger(stockage = globalThis.localStorage) {
  try { return JSON.parse(stockage.getItem(CLE_STOCKAGE)) || { jours: {}, serie: 0, meilleureSerie: 0 }; }
  catch { return { jours: {}, serie: 0, meilleureSerie: 0 }; }
}

function veille(jour) {
  const d = new Date(`${jour}T12:00:00`); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function seriePour(record, longueur) {
  return record.series?.[longueur] || 0;
}

export function enregistrer(record, partie, jour, stockage = globalThis.localStorage) {
  const longueur = partie.depart.length, cleJour = `${longueur}:${jour}`;
  const serieActuelle = seriePour(record, longueur);
  const dernierJour = record.derniersJours?.[longueur];
  const dejaFait = Boolean(record.jours[cleJour]);
  const nouvelleSerie = dejaFait ? serieActuelle : (dernierJour === veille(jour) ? serieActuelle + 1 : 1);
  const prochain = {
    ...record,
    jours: { ...record.jours, [cleJour]: { etapes: partie.chemin.length - 1, optimal: partie.optimal, indices: partie.indices, retours: partie.retours } },
    series: { ...record.series, [longueur]: nouvelleSerie },
    derniersJours: { ...record.derniersJours, [longueur]: jour },
    meilleureSerie: Math.max(record.meilleureSerie || 0, nouvelleSerie),
  };
  stockage.setItem(CLE_STOCKAGE, JSON.stringify(prochain));
  return prochain;
}
