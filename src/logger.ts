type Logger = {
  log: (...messages: any[]) => void;
  debug: (...messages: any[]) => void;
  error: (...messages: any[]) => void;
};

export const logger: Logger = {
  log: (...messages) => {
    if (process.env.DEBUG === "log") {
      console.log(...messages);
    }
  },
  debug: (...messages) => {
    if (process.env.DEBUG === "log" || process.env.DEBUG === "debug") {
      console.log(...messages);
    }
  },
  error: (...messages) => {
    console.error(...messages);
  },
};
