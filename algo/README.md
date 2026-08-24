# FizzBuzz

Implémentation de FizzBuzz en TypeScript, avec tests unitaires.

## L'exercice

Pour chaque entier de 1 à N, afficher :

- `Fizz` si le nombre est multiple de 3
- `Buzz` si le nombre est multiple de 5
- `FizzBuzz` si le nombre est multiple de 3 et de 5
- le nombre lui-même sinon

L'implémentation ne procède pas par cascade de `if / else if`, mais par **accumulation** :
on parcourt une table de règles `{ divisor, word }` et on concatène les mots dont le
diviseur divise `n`. `FizzBuzz` n'est donc pas un cas spécial codé en dur, mais la
conséquence naturelle de deux règles qui matchent. Ajouter une règle ne demande aucune
modification de la boucle.

## Lancer le projet

```bash
npm install

npm start      # affiche FizzBuzz de 1 à 100
npm test       # lance la suite Vitest
npm run typecheck  # vérifie les types sans émettre de JS
```

## Contrat d'entrée

`fizzBuzz(n)` attend un **entier supérieur ou égal à 1**.

Les entrées hors périmètre `NaN`, `Infinity`, décimaux, négatifs ne sont
volontairement **pas** gérées : le sujet cadre le problème de 1 à N, et aucun appelant du
projet ne produit ces valeurs. Ajouter une validation défensive coûterait du code et des
tests pour un cas qui n'existe pas ici. Le contrat est documenté plutôt que défendu à
l'exécution.

Si ce code devait devenir une brique publique consommée par du code tiers, le compromis
s'inverserait : la validation deviendrait nécessaire, puisque le contrat ne serait plus
garanti par l'appelant.
Solution : valider n au début de la fonction : 
if (!Number.isInteger(n) || n < 1 || !Number.isFinite(n)) {
    throw new Error("n must be a positive integer");
}

## Règles injectables

Le second paramètre de `fizzBuzz` est optionnel et vaut, par défaut, la table de règles du
module. Les appels existants ne changent pas ; un appelant qui a besoin de règles
différentes les fournit sans toucher à la fonction :

```ts
import { fizzBuzz, type Rule } from "./fizzbuzz.js";

const rules: readonly Rule[] = [{ divisor: 7, word: "Bazz" }];
fizzBuzz(7, rules); // "Bazz"
```

L'ordre du tableau détermine l'ordre de concaténation.

## Choix de TypeScript

TypeScript est un **surensemble de JavaScript** : tout JS valide est du TS valide. Il
ajoute un typage statique vérifié à la compilation, puis il est **transpilé en JS**
standard, il ne s'exécute pas tel quel, et n'apporte aucune dépendance à l'exécution.

Le choix est ici motivé par la cohérence avec la stack du poste. Sur ce fichier précis, le
typage documente le contrat (`Rule`, `readonly`) et le rend vérifiable : passer un tableau
de règles mal formé échoue à la compilation, pas en production.

Le projet est en mode `strict`, sans aucun `any`.

## Structure

| Fichier                | Rôle                                             |
| ---------------------- | ------------------------------------------------ |
| `src/fizzbuzz.ts`      | La logique pure, aucune I/O, donc testable       |
| `src/fizzbuzz.test.ts` | Les 6 tests Vitest                                |
| `src/index.ts`         | Le point d'entrée, la boucle et l'affichage      |

L'affichage est séparé de la logique : `fizzBuzz` retourne une chaîne et ne connaît pas
`console`. C'est ce qui permet de la tester sans capturer la sortie standard.

## Tests

6 tests couvrent les classes d'équivalence du problème : multiple de 3, multiple de 5,
multiple des deux, aucune correspondance, plus deux tests sur les règles injectées, dont
un qui vérifie que l'ordre du tableau détermine l'ordre de concaténation.

```bash
npm test
```

## Développement assisté par IA

Cet exercice a été développé avec l'assistance de Claude Code dans VSCodium, selon la même
méthode que l'exercice frontend : spécification écrite, génération, puis relecture et
vérification par l'autrice. Le détail figure dans le
[README frontend](../frontend/README.md#développement-assisté-par-ia).
