module.exports = {
  testEnvironment: "node",
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["app.js", "config.js"],
  testMatch: ["**/__tests__/**/*.test.js"],
};
