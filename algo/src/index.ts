import { fizzBuzz } from "./fizzbuzz.js";

// entry point. output isolated here so fizzBuzz stays pure and testable
function printFizzBuzz(limit: number): void {
  for (let n = 1; n <= limit; n++) {
    console.log(fizzBuzz(n));
  }
}

printFizzBuzz(100);
