/**
 * This is a simple TypeScript file to test compilation
 */

// Basic types
const _str = 'Hello, world!';
const _num = 42;
const _bool = true;

// Array
const _arr: number[] = [1, 2, 3];

// Object
interface Person {
  name: string;
  age: number;
}

const _person: Person = {
  name: 'John',
  age: 30,
};

// Function
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Export something
export { greet, Person };

// For testing purposes only
// console.log(_str, _num, _bool, _arr, _person, greet('TypeScript'));
