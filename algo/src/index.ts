import { fizzBuzz } from "./fizzbuzz.js";

function printFizzBuzz(limit: number): void {
  for (let n = 1; n <= limit; n++) {
    console.log(fizzBuzz(n));
  }
}

printFizzBuzz(100);
