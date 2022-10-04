module.exports = {
  collectCoverage: true,
  coverageReporters: ["text", "html"],
  setupFilesAfterEnv: ["<rootDir>/.jest/setupFilesAfterEnv.js"],
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(music-metadata|strtok3|peek-readable|file-type|token-types)/)",
  ],
  transform: {
    "^.+\\.ts$": ["@swc/jest"],
    "^.+\\.js$": ["babel-jest"],
  },
};
