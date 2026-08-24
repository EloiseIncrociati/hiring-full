export type Rule = { readonly divisor: number; readonly word: string };

// default rules, built once at module load
const DEFAULT_RULES = [
  { divisor: 3, word: "Fizz" },
  { divisor: 5, word: "Buzz" },
] as const satisfies readonly Rule[];

/**
 * Builds the FizzBuzz output for a single number.
 *
 * @param n Integer >= 1. Out-of-contract values (NaN, Infinity, decimals,
 *          negatives) are not handled, see the README.
 * @param rules Optional rule table. Array order drives concatenation order.
 * @returns The matching words joined together, or `n` as a string if none match.
 */
// accumulate matching words, else n as string
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
