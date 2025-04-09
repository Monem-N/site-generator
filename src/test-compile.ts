/**
 * This is a simple TypeScript file to test compilation
 */

// Object
interface Person {
  name: string;
  age: number;
}

// Function
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Export something
export { greet, Person };
