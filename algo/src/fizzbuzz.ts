export type Rule = { readonly divisor: number; readonly word: string };

const DEFAULT_RULES = [
  { divisor: 3, word: "Fizz" },
  { divisor: 5, word: "Buzz" },
] as const satisfies readonly Rule[];

/**
 * Contrat : `n` est un entier >= 1 (cf. README).
 * Les règles sont évaluées dans l'ordre du tableau : l'ordre définit la concaténation.
 */
export function fizzBuzz(n: number, rules: readonly Rule[] = DEFAULT_RULES): string {
  let result = "";
  for (const rule of rules) {
    if (n % rule.divisor === 0) {
      result += rule.word;
    }
  }
  if (result === "") {
    return String(n);
  }
  return result;
}
