# GitHub User Search

Recherche d'utilisateurs GitHub en React + TypeScript, avec sélection multiple, duplication et suppression côté client.

---

## 1. Présentation

* **Recherche en direct** —> interroge `GET /search/users` sans bouton de validation.
* **Debounce de 350 ms** —> limite les appels réseau pendant la saisie.
* **Annulation des requêtes** —> `AbortController` empêche une réponse obsolète d'écraser une recherche plus récente.
* **États de recherche explicites** —> chargement, succès, erreur réseau et quota GitHub dépassé.
* **Grille responsive** —> avatar, login, identifiant et lien vers le profil GitHub.
* **Sélection et actions** —> sélection multiple, tout sélectionner, duplication et suppression avec confirmation.
* **Mode édition et thèmes** —> contrôles masquables et thèmes clair/sombre.

Les duplications et suppressions sont uniquement locales et sont réinitialisées lorsqu'une nouvelle recherche aboutit.

---

## 2. Installation et lancement

```bash
cd frontend
npm install
```

| Commande           | Rôle                                                         |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Serveur de développement avec HMR : `http://localhost:5173/` |
| `npm run build`    | `tsc -b` puis build Vite dans `dist/`                        |
| `npm run preview`  | Sert le build de production                                  |
| `npm run test:run` | Lance les tests une fois, notamment pour la CI               |
| `npm test`         | Lance les tests en mode watch                                |
| `npm run lint`     | Lance `oxlint`                                               |

`npm run build` lance `tsc -b` avant Vite, car esbuild transpile sans vérifier les types.

---

## 3. Stack et contraintes

| Domaine | Choix                                        |
| ------- | -------------------------------------------- |
| UI      | React 19 + TypeScript (`strict`, zéro `any`) |
| Build   | Vite                                         |
| Styles  | CSS Modules + variables CSS natives          |
| Réseau  | `fetch` + `AbortController` natifs           |
| Tests   | Vitest + Testing Library + jsdom             |

### Dépendances runtime

Seuls React et React DOM sont utilisés en runtime :

```json
"dependencies": {
  "react": "^19.2.8",
  "react-dom": "^19.2.8"
}
```

Le reste est en `devDependencies`.

Aucune dépendance supplémentaire n'a été utilisée pour :

* l'HTTP : `fetch` ;
* les requêtes : hook maison ;
* les utilitaires : `Map`, `Set`, `flatMap` ;
* les styles : CSS Modules et variables CSS ;
* les icônes : SVG inline ;
* les polices : Google Fonts via `<link>` ;
* la validation API : garde de type maison plutôt que `zod`.

---

## 4. Structure

```text
frontend/
├── index.html
└── src/
    ├── main.tsx
    ├── index.css               # styles globaux : design tokens et reset
    ├── App.tsx
    │
    ├── types/
    │   └── github.ts
    │
    ├── hooks/
    │   ├── useUserSearch.ts
    │   ├── useSelectableList.ts
    │   └── useTheme.ts
    │
    ├── components/             # uniquement des .tsx
    │   ├── SearchBar.tsx
    │   ├── SearchStatus.tsx
    │   ├── ActionBar.tsx
    │   ├── UserGrid.tsx
    │   ├── UserCard.tsx
    │   ├── EditModeToggle.tsx
    │   └── ThemeToggle.tsx
    │
    ├── styles/                 # tous les CSS Modules
    │   ├── App.module.css
    │   ├── SearchBar.module.css
    │   ├── SearchStatus.module.css
    │   ├── ActionBar.module.css
    │   ├── UserGrid.module.css
    │   ├── UserCard.module.css
    │   ├── EditModeToggle.module.css
    │   ├── ThemeToggle.module.css
    │   └── controls.module.css # checkbox et bouton icône partagés
    │
    └── test/
        ├── setup.ts
        └── helpers.ts
```

Tous les CSS Modules sont regroupés dans `src/styles/` : les composants ne contiennent
que du `.tsx` et importent leur feuille via `../styles/`. `index.css` reste à la racine de
`src/` car ce sont des styles globaux, pas un module CSS.

Les hooks portent la logique et les composants se concentrent sur l'affichage.

* **`useUserSearch(query)`** debounce, requêtes, annulation, statuts et validation de la réponse API.
* **`useSelectableList(users)`** sélection, duplication, suppression et calcul des doublons. Ses 13 tests tournent sans DOM.
* **`useTheme()`** préférence système au premier rendu puis gestion de `data-theme`.

Les composants ne contiennent pas de logique métier. Par exemple, `UserGrid` reçoit `isSelected` et `isDuplicated` sous forme de prédicats.

---

## 5. Couverture de l'énoncé

> **Note :** la numérotation ci-dessous reconstitue les points de l'énoncé à partir des spécifications rédigées pendant le développement. Le point 8 est explicitement identifié dans le sujet ; les autres numéros sont indicatifs et restent à recouper avec le sujet.

| #     | Attendu                 | Traitement                                                     |
| ----- | ----------------------- | -------------------------------------------------------------- |
| 1     | Champ de recherche      | `SearchBar`, input contrôlé et label associé                   |
| 2     | Appel à l'API GitHub    | `GET /search/users?q=`, `fetch` natif                          |
| 3     | Affichage des résultats | `UserGrid` + `UserCard`                                        |
| 4     | Sélection par carte     | Checkbox par carte, identifiée par `instanceId`                |
| 5     | Tout sélectionner       | Checkbox tri-état + compteur                                   |
| 6     | Dupliquer               | Copie des cartes sélectionnées après leur original             |
| 7     | Supprimer               | Retrait avec confirmation en deux temps                        |
| 8     | Actions front-only      | Aucun appel à GitHub, nouvelle recherche = liste fraîche       |
| Bonus | Mode édition            | `EditModeToggle`, contrôles non montrés lorsqu'il est désactivé |

### Cas limites principaux

| Cas                          | Comportement                                                         |
| ---------------------------- | -------------------------------------------------------------------- |
| Aucun résultat               | `No users found`                                                     |
| Tous les résultats supprimés | `All results removed`                                                |
| Rate limit                   | `403` + `x-ratelimit-remaining: 0` → message dédié                   |
| Race condition               | Une réponse tardive ne peut pas remplacer une recherche plus récente |
| Réponse malformée            | Les entrées invalides sont ignorées sans faire planter l'application |

Sont également gérés : recherche vide, erreur réseau, `403` sans quota épuisé, annulation par `AbortError` et démontage pendant une requête.

---

## 6. Tests

**61 tests, répartis dans 3 fichiers**, exécutés avec Vitest sous jsdom.

| Fichier                               | Tests | Portée                                                |
| ------------------------------------- | ----- | ----------------------------------------------------- |
| `src/hooks/useUserSearch.test.ts`     | 6     | Debounce, annulation, statuts                         |
| `src/hooks/useSelectableList.test.ts` | 13    | Sélection, duplication, suppression, duplicité, reset |
| `src/App.test.tsx`                    | 42    | Comportement observable de l'application              |

La logique est testée directement dans les hooks, sans DOM. L'UI est testée avec les rôles et noms accessibles, et les timers et le réseau sont contrôlés par les tests plutôt que par de vraies attentes ou de vrais appels GitHub.

### Vérification par mutation

J'ai aussi cassé volontairement plusieurs parties du code pour vérifier que les tests concernés échouaient bien : debounce supprimé, `signal` absent de `fetch`, identifiant réutilisé lors d'une copie, calcul de duplicité inversé ou figé, sélection non purgée, contrôles toujours montés, etc.

Une mutation a survécu : supprimer `setSelectedIds` lors d'une nouvelle recherche ne fait échouer aucun test, car le compteur est calculé à partir des items courants. La ligne reste néanmoins utile pour éviter d'accumuler des identifiants qui ne correspondent plus à aucun item.

### Ce qui n'est pas couvert

Le rendu visuel n'est pas testé automatiquement : jsdom ne calcule ni CSS ni layout. Les tests vérifient la structure, les rôles et les attributs, mais pas l'apparence réelle. Les contrastes du thème clair ont été calculés avec la formule de contraste WCAG.

---

## 7. Développement assisté par IA

Ce projet a été développé avec l'assistance d'une IA. Cette section décrit la répartition du travail.

### Outils

* **VSCodium** comme éditeur.
* **Claude** comme assistant IA pour préparer les prompts à insérer dans Claude Code et éviter ainsi les erreurs de compréhension. 
Chaque prompt est dirigé, relu, vérifié et ajusté si besoin avant de le passer à l'extension Claude Code pour coder l'application.
* **Claude Code** comme assistant IA en extension VSCodium pour générer du code à partir de spécifications écrites.

### Méthode

Le développement a été découpé en **tranches successives** : squelette et tests, recherche réseau, sélection et actions, design, corrections, mode édition, thèmes, puis documentation.

Chaque tranche partait d'une **spécification écrite** précisant le résultat attendu et les contraintes : pas de nouvelle dépendance, TypeScript strict, tests existants à préserver. Le code généré n'était pas accepté tel quel.

### Répartition du travail

**a) Direction produit et choix d'expérience, initiés par l'autrice**

Le thème sombre puis clair, le halo de sélection, le liseré des doublons, les couleurs des actions, le bouton « View profile », la confirmation avant suppression, les finitions visuelles et le positionnement du header viennent de mes choix.

J'ai également **repéré une incohérence sur les cartes dupliquées** : après avoir dupliqué A en A1 et A2 puis supprimé A et A1, la carte restante gardait son liseré de doublon alors qu'elle était redevenue unique (explication à claude de cet exemple pour bien lui faire comprendre).

Cela a conduit à revoir la modélisation : le drapeau de duplicité figé a été remplacé par une valeur dérivée de la liste courante. Cela a aussi corrigé un autre problème : l'original n'était pas marqué comme doublon alors qu'il devait l'être.

**b) Options d'architecture, proposés par l'assistant, évalués et arbitrés par l'autrice**

L'assistant a proposé notamment le découpage en tranches, la duplicité comme valeur dérivée, la confirmation inline, l'isolation de la logique dans des hooks testables, la priorisation des éléments explicitement demandés et l'absence de sur-engineering.

Ces propositions ont été discutées puis retenues, modifiées ou écartées. Les alternatives sont détaillées en section 8.

**c) Génération de code, réalisée par Claude Code**

Le code a été généré à partir des spécifications précédentes, puis **relu, exécuté et testé par l'autrice**.

### Vérification

* Relecture du code produit.
* Exécution locale.
* 61 tests unitaires et d'intégration.
* Vérification par mutation pour contrôler que les tests détectent bien certaines régressions.
* Réécriture manuelle de tous les commentaires, repères de section, JSDoc de contrat sur les API publiques

L'autrice reste responsable de l'intégralité du code soumis.

---

## 8. Décisions et arbitrages

### `instanceId` distinct de `user.id`

Chaque ligne possède un identifiant d'instance généré côté client, distinct de l'identifiant GitHub. `user.id` identifie un compte, pas une occurrence dans la liste. Avec des doublons, utiliser cet identifiant pour React ou la sélection ferait correspondre plusieurs lignes au même élément.

**Alternative écartée** utiliser l'index du tableau comme clé. Les insertions et suppressions au milieu de la liste rendent cette approche fragile.

### « Être un doublon » : valeur dérivée, pas de drapeau stocké

La duplicité doit refléter le contenu actuel de la liste, pas la façon dont une carte a été créée. Le cas A/A1/A2 l'a montré : un drapeau fixé à la création devenait faux après suppression.

La duplicité est donc recalculée depuis la liste avec `useMemo`, ce qui marque toutes les occurrences, original compris.

**Alternative écartée** mettre à jour manuellement le drapeau à chaque suppression. Cela dupliquerait la logique de calcul à plusieurs endroits.

### Confirmation de suppression inline plutôt que modale

Le bouton Delete demande une seconde activation, avec un libellé explicite. La confirmation disparaît après perte de focus, changement de sélection ou trois secondes.

La suppression reste locale et réversible : une nouvelle recherche restaure les données GitHub. Une modale serait donc assez lourde pour une action dont le coût d'erreur reste limité.

**Alternative écartée** une modale. Elle serait plus adaptée à une suppression persistante côté serveur, mais demanderait aussi la gestion du focus, de `Escape`, de l'inertie du fond, etc. Conseillée pour la suppression de plusieurs éléments avec l'aperçu des avatars au nombre de 5 maximum. 

### Purge de la sélection en quittant le mode édition

Quitter le mode édition vide la sélection. Sinon, des cartes pourraient rester sélectionnées sans que l'utilisateur le voie et être supprimées plus tard par erreur.

Les actions déjà effectuées restent conservées : seule l'intention de sélection en attente est supprimée.

**Alternative écartée** conserver la sélection pour éviter de tout recocher. Plus confortable, mais moins sûr pour une action destructive.

### Validation runtime de la réponse API plutôt qu'un `as`

`response.json()` renvoie `unknown`. Un simple `as GithubSearchResponse` ferait uniquement confiance au type annoncé sans vérifier la réponse réelle.

Un garde de type d'une vingtaine de lignes vérifie donc la structure et écarte les entrées non conformes.

**Alternative écartée** `zod`, qui aurait ajouté une dépendance alors que la validation nécessaire reste limitée à quelques champs.

### Thème en variables CSS dès le départ

Les couleurs utilisent des variables CSS dès la première tranche. Ajouter le thème clair a donc consisté à redéclarer les mêmes tokens sous `:root[data-theme='light']`, sans modifier les composants.

La bascule se fait à l'exécution, sans re-rendu React ni rechargement. Le second thème a aussi permis de repérer les deux seules ombres encore définies directement et de les transformer en tokens.

**Alternative écartée** couleurs en dur ou variables Sass compilées. Il aurait fallu modifier et dupliquer davantage de styles pour ajouter le second thème.

### Mode édition activé par défaut

Le mode édition démarre activé afin que les fonctionnalités demandées soient visibles immédiatement sur un exercice technique.

**Alternative écartée** démarrer en lecture seule. Ce serait plus prudent pour une vraie application de consultation, où les actions d'édition seraient secondaires.

### Largeur des cartes

Le wireframe indique des cartes de 100 px. Cette largeur ne permet pas d'afficher correctement l'avatar, un login complet et le bouton « View profile ».

La grille utilise donc `repeat(auto-fill, minmax(11rem, 1fr))` pour adapter le nombre de colonnes à l'espace disponible, sans media query.

**Alternative écartée** respecter strictement les 100 px. Ce serait plus fidèle au chiffre de la maquette, mais produirait des cartes trop petites et un bouton difficile à utiliser.

---

## 9. Limites connues

* **Rendu visuel non testé automatiquement** jsdom ne calcule ni CSS ni layout. Les tests vérifient la structure, les rôles et les attributs, pas l'apparence. Une vraie régression visuelle nécessiterait par exemple Playwright et une dépendance supplémentaire.
* **`color-mix()`** utilisé pour les halos et états de survol. La propriété nécessite un navigateur récent : Chrome/Edge 111+, Safari 16.2+, Firefox 113+. Elle n'est pas transpilée par le build.
* **Thème non persisté** le choix reste valable pendant la session. `localStorage` ajouterait une gestion de préférence persistée, des cas d'erreur et un risque de flash au chargement.
* **Préférence système lue une seule fois** les changements de `prefers-color-scheme` pendant la session ne sont pas suivis afin de ne pas écraser un éventuel choix explicite de l'utilisateur.
* **Pas de pagination** l'API GitHub renvoie 30 résultats par défaut.
* **Recherche non authentifiée** le quota GitHub anonyme est de 10 requêtes par minute sur l'endpoint de recherche. Il peut donc être atteint rapidement en test intensif, d'où le message dédié.
