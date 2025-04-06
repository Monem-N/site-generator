// This file is run after the test environment is set up but before each test file
// Add any global test setup here

// Mock console.log and console.error to keep test output clean
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};
