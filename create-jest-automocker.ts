// @ts-expect-error yup
import path, { sep } from "path";

const originalModulesMap = new Map();

export const createJestAutomocker = (filename: string) => {
  if (process.env.JEST_WORKER_ID) {
    return;
  }

  // @ts-expect-error asd
  jest.mock = (moduleName, factoryFn) => {
    let module = requireModule(filename, moduleName);

    if (!module.default) {
      if (!factoryFn) {
        Object.keys(module).forEach((key) => (module[key] = jest.fn()));
      } else {
        module = factoryFn();
      }
    } else {
      if (!factoryFn) {
        Object.keys(module.default).forEach((key) => (module.default[key] = jest.fn()));
      } else {
        module = factoryFn();
      }
    }
  };

  jest.requireActual = require;

  jest.unmock = (moduleName) => {
    const modulePath = resolveModulePath(filename, moduleName);

    return unmockModule(modulePath);
  };

  return { ...jest };
};

const requireModule = (filename: string, moduleName: string) => {
  let module;
  let modulePath: string;

  if (!moduleName.startsWith(".")) {
    module = require(moduleName);
    modulePath = moduleName;
  } else {
    modulePath = resolveModulePath(filename, moduleName);
    // eslint-disable-next-line
    module = require(modulePath);
  }

  if (!originalModulesMap.has(modulePath)) {
    originalModulesMap.set(modulePath, {
      ...module,
      default: module.default ? { ...module.default } : null,
    });
  }

  return module;
};

const resolveModulePath = (filename: string, moduleName: string) => {
  const parts = filename.split(sep);
  const paths = parts.slice(0, parts.length - 1);

  return path.join(paths.join(sep), moduleName);
};

const unmockModule = (modulePath: string) => {
  const origModule = originalModulesMap.get(modulePath);
  // eslint-disable-next-line
  const module = require(modulePath);

  if (!origModule) {
    return;
  }

  if (!module.default) {
    Object.keys(module).forEach((key) => (module[key] = origModule[key]));
  } else {
    Object.keys(module.default).forEach((key) => (module.default[key] = origModule.default[key]));
  }

  originalModulesMap.delete(modulePath);

  return module;
};

export const unmockAll = () => {
  Array.from(originalModulesMap).forEach(([modulePath]) => modulePath && unmockModule(modulePath));
};
