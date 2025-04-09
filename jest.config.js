export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?)$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: false,
  verbose: true,

  // Force exit after tests are complete
  forceExit: true,
  // Detect open handles (like unfinished network requests or timers)
  detectOpenHandles: true,
  // Disable watchman for file watching
  watchman: false,
  // Set a timeout for each test
  testTimeout: 10000,
};
