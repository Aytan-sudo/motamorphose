export const THEMES = ['papier', 'nuit', 'contraste', 'ocean', 'foret', 'bonbon'];

export function themeInitial(stockage = globalThis.localStorage) {
  const theme = stockage?.getItem('motamorphose:theme');
  return THEMES.includes(theme) ? theme : 'papier';
}

export function themeSuivant(theme) {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}
