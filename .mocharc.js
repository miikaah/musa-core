// https://github.com/mochajs/mocha/blob/master/example/config/.mocharc.js

module.exports = {
  reporter: "min",
  require: "mochaHooks.ts",
  spec: ["src/**/*.spec.ts"],
};
