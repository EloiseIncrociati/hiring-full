import { describe, expect, it } from "vitest";
import { fizzBuzz, type Rule } from "./fizzbuzz.js";

describe("fizzBuzz", () => {
  // default rules
  it("renvoie 'Fizz' pour un multiple de 3", () => {
    expect(fizzBuzz(3)).toBe("Fizz");
    expect(fizzBuzz(9)).toBe("Fizz");
  });

  it("renvoie 'Buzz' pour un multiple de 5", () => {
    expect(fizzBuzz(5)).toBe("Buzz");
    expect(fizzBuzz(20)).toBe("Buzz");
  });

  it("renvoie 'FizzBuzz' pour un multiple de 15", () => {
    expect(fizzBuzz(15)).toBe("FizzBuzz");
    expect(fizzBuzz(30)).toBe("FizzBuzz");
  });

  it("renvoie le nombre en chaîne quand aucune règle ne matche", () => {
    expect(fizzBuzz(1)).toBe("1");
    expect(fizzBuzz(7)).toBe("7");
  });

  it("accepte des règles injectées", () => {
    const rules: readonly Rule[] = [{ divisor: 7, word: "Bazz" }];

    expect(fizzBuzz(7, rules)).toBe("Bazz");
    expect(fizzBuzz(3, rules)).toBe("3");
  });

  it("concatène les règles injectées dans l'ordre du tableau", () => {
    const rules: readonly Rule[] = [
      { divisor: 3, word: "Fizz" },
      { divisor: 7, word: "Bazz" },
    ];

    expect(fizzBuzz(21, rules)).toBe("FizzBazz");
  });
});
