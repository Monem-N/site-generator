/**
 * This is a simple TypeScript file to test compilation
 */

// Basic types
const str: string = 'Hello, world!';
const num: number = 42;
const bool: boolean = true;

// Array
const arr: number[] = [1, 2, 3];

// Object
interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: 'John',
  age: 30
};

// Function
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Export something
export { greet, Person };

console.log(str, num, bool, arr, person, greet('TypeScript'));
