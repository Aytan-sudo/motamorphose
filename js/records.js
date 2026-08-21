export const CLE_STOCKAGE = 'motamorphose:v1';

export function charger(stockage = globalThis.localStorage) {
  try { return JSON.parse(stockage.getItem(CLE_STOCKAGE)) || { jours: {}, serie: 0, meilleureSerie: 0 }; }
  catch { return { jours: {}, serie: 0, meilleureSerie: 0 }; }
}

function veille(jour) {
  const d = new Date(`${jour}T12:00:00`); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function enregistrer(record, partie, jour, stockage = globalThis.localStorage) {
  const dejaFait = Boolean(record.jours[jour]);
  const nouvelleSerie = dejaFait ? record.serie : (record.dernierJour === veille(jour) ? record.serie + 1 : 1);
  const prochain = {
    ...record,
    jours: { ...record.jours, [jour]: { etapes: partie.chemin.length - 1, optimal: partie.optimal, indices: partie.indices } },
    serie: nouvelleSerie,
    meilleureSerie: Math.max(record.meilleureSerie || 0, nouvelleSerie),
    dernierJour: jour
  };
  stockage.setItem(CLE_STOCKAGE, JSON.stringify(prochain));
  return prochain;
}

