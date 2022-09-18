module.exports = {
  collectCoverage: true,
  coverageReporters: ["text", "html"],
  setupFilesAfterEnv: ["<rootDir>/.jest/setupFilesAfterEnv.js"],
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
};
