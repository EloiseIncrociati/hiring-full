# Tests techniques : Candidature Full

Ce dépôt regroupe les deux exercices techniques. **Chaque dossier est un projet
autonome**, avec son propre `package.json`, ses dépendances et ses commandes : il n'y a
ni workspace ni outillage partagé à la racine. On installe et on lance chaque exercice
depuis son dossier.

## Les deux exercices

| Dossier | Exercice | Stack | Tests |
| --- | --- | --- | --- |
| [`algo/`](algo/) | FizzBuzz | TypeScript, Vitest | 6 |
| [`frontend/`](frontend/) | Recherche d'utilisateurs GitHub | React, TypeScript, Vite | 61 |

### `algo/` FizzBuzz

Implémentation par accumulation sur une table de règles injectables, plutôt que par
cascade de `if / else if`. Contrat d'entrée documenté (entier ≥ 1).

→ [`algo/README.md`](algo/README.md)

```bash
cd algo
npm install
npm start   # affiche FizzBuzz de 1 à 100
npm test    # suite Vitest
```

### `frontend/` GitHub User Search

Recherche en direct contre l'API GitHub (debounce, annulation des requêtes en vol),
sélection multiple, duplication et suppression front-only, mode édition, thèmes clair et
sombre. Aucune dépendance runtime hors React.

→ [`frontend/README.md`](frontend/README.md) documentation principale du projet.

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173/
npm run test:run  # suite Vitest, une passe
```

## Développement assisté par IA

Les deux exercices ont été développés avec l'assistance de Claude Code dans VSCodium.
La méthode de travail, la répartition des contributions et les moyens de vérification
sont détaillés dans la section dédiée du
[README frontend](frontend/README.md#développement-assisté-par-ia).
