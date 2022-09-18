import expect from "expect";
import { ModuleMocker } from "jest-mock";

import { createJestAutomocker, unmockAll } from "./create-jest-automocker";

const jest = new ModuleMocker(globalThis);
jest.fn = jest.fn.bind(jest);
jest.spyOn = jest.spyOn.bind(jest);
jest.mocked = jest.mocked.bind(jest);
// @ts-expect-error yup
jest.mock = () => undefined;

// @ts-expect-error yup
global.jest = jest;
// @ts-expect-error yup
global.expect = expect;
global.beforeAll = (fn: () => unknown) => before(fn);
global.afterAll = (fn: () => unknown) => after(fn);

exports.mochaHooks = {
  beforeEach: function () {
    createJestAutomocker(this.currentTest.file);
    jest.clearAllMocks();
  },
  afterEach: function () {
    unmockAll();
  },
};
