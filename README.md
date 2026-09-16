# Motamorphose

Un jeu de mot-échelle français : partez d’un mot et rejoignez la cible en ne
changeant qu’une lettre à chaque étape. Les sessions proposent quatre, cinq
ou six lettres, avec cinq par défaut. Le jeu annonce ensuite le nombre de
coups joués et la distance optimale.

Il fonctionne dans le navigateur, au doigt comme au clavier, sans serveur et
sans dépendance de production. Une fois chargé, il reste disponible hors ligne.

## Version 1.1.3

- **le viewport interdit enfin le zoom tactile** (`user-scalable=no`, complété
  par `touch-action: manipulation` — iOS ignore le premier) ;
- **l'icône d'écran d'accueil existe** : `assets/icon-180.png`, plus les PNG
  192 et 512 du manifeste, exportés d'`icon.svg` par `npm run icones`. iOS
  refuse le SVG : sans ce PNG, un jeu ajouté à l'écran d'accueil n'a pas
  d'icône. Le précache les liste, le cache passe en v7.

Les deux manques dataient de la première version et ne se voyaient pas depuis
un ordinateur ; c'est la vérification dans le simulateur iOS qui les a levés.

## Version 1.1.2

- les cibles tactiles de l'interface passent à 44 px (boutons d'en-tête,
  boutons texte, listes déroulantes), conformément à la convention.
- la liste déroulante de difficulté reçoit une hauteur ferme — WebKit ignore
  `min-height` sur un `select` natif et la rendait à 23 px sur iPhone.

## Jouer

Saisissez un mot français de cinq lettres qui ne diffère que d’une lettre du
mot courant. La lettre transformée est mise en évidence dans la chaîne.

- **Mot du jour** — la même paire pour tout le monde, dérivée de la date.
- **Libre** — une nouvelle paire à distance optimale 4, 5 ou 6.
- **Indice** — propose la prochaine étape optimale depuis votre position
  actuelle. Deux indices sont disponibles par partie et coûtent 15 points chacun.
- **Revenir** — retire la dernière étape tant que la partie n’est pas terminée.
  Chaque retour coûte 3 points et apparaît dans le résultat partagé.

Les résultats quotidiens et la série sont conservés uniquement dans le
`localStorage` du navigateur.

## Le dictionnaire

Les trois listes versionnées sont produites hors ligne à partir de **Lexique
4.00**, **Morphalou 3.1** et **Grammalecte 7.7**. Deux
niveaux sont conservés : les mots acceptés, utilisables par le joueur, et les
mots communs, seuls autorisés pour garantir au moins une solution accessible.
L’optimal est toujours calculé dans le dictionnaire accepté complet.

Source : New, B., Pallier, C., Schalchli, G., Bourgin, J., & Gimenes, M. (2026),
« Lexique 4: A major upgrade of the “Lexique” French lexical database »,
*Behavior Research Methods*, [lexique.org](https://www.lexique.org/).

Lexique est distribué sous licence **CC BY-SA 4.0**, Morphalou sous
**LGPL-LR** et le lexique Grammalecte sous **MPL 2.0**. Les sources brutes ne
sont pas versionnées ; leurs notices et les liens de téléchargement sont
documentés dans `donnees-source/README.md`.

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

Téléchargez les trois sources décrites dans `donnees-source/README.md`, puis :

```bash
npm run dictionnaire  # reconstruit les JSON 4, 5 et 6 lettres
npm test              # teste le noyau et la structure sans navigateur
npm run serve         # ouvre un serveur sur http://localhost:8765
```

Aucun bundler n’est nécessaire. Ouvrir directement `index.html` en `file://`
ne fonctionne pas, car le navigateur doit charger des modules ES et le JSON.

## Ce qui n’est pas là

Le dictionnaire accepté exige soit une présence confirmée dans deux sources,
soit les mesures de familiarité de Lexique. Il ne prétend pas couvrir tous les
termes techniques, régionaux ou anciens du français.

Les mots sont saisis sans accent pour éliminer les ambiguïtés entre formes
normalisées. La graphie accentuée retenue par Lexique reste affichée, mais deux
homographes tels que « cote » et « côte » ne peuvent pas coexister.

Le mode quotidien est stable pour une date, une longueur et la version 2 du
dictionnaire. Les séries quotidiennes sont distinctes pour chaque longueur.
