// https://github.com/mochajs/mocha/blob/master/example/config/.mocharc.js

module.exports = {
  reporter: "list",
  require: "mochaHooks.ts",
  spec: ["src/**/*.spec.ts"],
};
