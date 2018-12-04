module.exports = {
  coverageDirectory: 'coverage',
  coverageReporters: ['cobertura', 'json', 'lcov'],
  reporters: ['default', 'jest-junit'],
  collectCoverageFrom: [
    'packages/*/src/**/*.js',
    'packages/*/src/**/*.ts*',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/*.d.ts',
  ],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '^.+\\.css$': 'identity-obj-proxy',
    // direct imports from /dist
    '^@dws/muster/dist/(.*)$': '<rootDir>/packages/muster/src/$1',
    '^@dws/muster-react/dist/(.*)$': '<rootDir>/packages/muster-react/src/$1',
    // e.g. muster/test
    '^@dws/muster/(.*)$': '<rootDir>/packages/muster/src/$1',
    '^@dws/muster-react/(.*)$': '<rootDir>/packages/muster-react/src/$1',
    // just package* imports
    '^@dws/muster(-?[\w|-]*)$': '<rootDir>/packages/muster$1/src',
  },
  modulePathIgnorePatterns: ['<rootDir>/docs', '<rootDir>/packages/*/esm'],
  roots: ['<rootDir>/packages'],
  setupFiles: ['<rootDir>/jest.js'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/esm/'],
  testRegex: '(?=^.+\\.spec\\.[jt]sx?)(?!^.+\\.native\\.spec\\.[jt]sx?)(?!^.+\\.snap).*$',
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
};
