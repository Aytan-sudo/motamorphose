# Motamorphose

Un jeu de mot-échelle français : partez d’un mot et rejoignez la cible en ne
changeant qu’une lettre à chaque étape. Le jeu annonce ensuite le nombre de
coups joués et la distance optimale.

Il fonctionne dans le navigateur, au doigt comme au clavier, sans serveur et
sans dépendance de production. Une fois chargé, il reste disponible hors ligne.

## Jouer

Saisissez un mot français de cinq lettres qui ne diffère que d’une lettre du
mot courant. La lettre transformée est mise en évidence dans la chaîne.

- **Mot du jour** — la même paire pour tout le monde, dérivée de la date.
- **Libre** — une nouvelle paire à distance optimale 4, 5 ou 6.
- **Indice** — propose la prochaine étape optimale depuis votre position
  actuelle. Il est comptabilisé dans le résultat partagé.
- **Revenir** — retire la dernière étape tant que la partie n’est pas terminée.

Les résultats quotidiens et la série sont conservés uniquement dans le
`localStorage` du navigateur.

## Le dictionnaire

La liste versionnée est produite hors ligne à partir de **Lexique 4.00**. Deux
niveaux sont conservés : les mots acceptés, utilisables par le joueur, et les
mots communs, seuls autorisés pour garantir au moins une solution accessible.
L’optimal est toujours calculé dans le dictionnaire accepté complet.

Source : New, B., Pallier, C., Schalchli, G., Bourgin, J., & Gimenes, M. (2026),
« Lexique 4: A major upgrade of the “Lexique” French lexical database »,
*Behavior Research Methods*, [lexique.org](https://www.lexique.org/).

Lexique est distribué sous licence **CC BY-SA 4.0**. Le fichier dérivé
`js/data/mots5.json` est partagé sous les mêmes conditions. Le TSV original
n’est pas versionné.

## Comment c’est fait

Le graphe est construit en `O(n × L)` avec des seaux à joker (`M_ISON`,
`MA_SON`…), puis parcouru en largeur. Le noyau ne touche jamais au DOM.

```text
js/graphe.js    voisinage et composantes
js/bfs.js       distances et chemins optimaux
js/paires.js    qualification des puzzles
js/partie.js    règles et validation
js/defi.js      défi quotidien et partage
js/hasard.js    hasard déterministe
js/records.js   séries et records
js/render.js    rendu de la chaîne
js/app.js       assemblage du navigateur
```

## Développement

Téléchargez `Lexique400.tsv` dans `donnees-source/`, puis :

```bash
npm run dictionnaire  # reconstruit js/data/mots5.json et affiche son audit
npm test              # teste le noyau et la structure sans navigateur
npm run serve         # ouvre un serveur sur http://localhost:8765
```

Aucun bundler n’est nécessaire. Ouvrir directement `index.html` en `file://`
ne fonctionne pas, car le navigateur doit charger des modules ES et le JSON.

## Ce qui n’est pas là

Le dictionnaire privilégie volontairement les mots familiers. Il ne cherche pas
à accepter tous les termes techniques, régionaux ou anciens du français.

Les mots sont saisis sans accent pour éliminer les ambiguïtés entre formes
normalisées. La graphie accentuée retenue par Lexique reste affichée, mais deux
homographes tels que « cote » et « côte » ne peuvent pas coexister.

Le mode quotidien est stable pour une date et la version `mots5-v1` du
dictionnaire. Une future liste de quatre lettres formera une série distincte.

