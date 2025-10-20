module.exports = {
  "testEnvironment": "node",
  "testMatch": [
    "**/tests/**/*.test.js",
    "**/?(*.)+(spec|test).js"
  ],
  "collectCoverageFrom": [
    "middleware/groupAuth.js",
    "routes/groupApi.js",
    "helpers/firebase-admin-utils.js"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "setupFilesAfterEnv": [
    "<rootDir>/tests/setup.js"
  ],
  "testTimeout": 10000,
  "verbose": true
};