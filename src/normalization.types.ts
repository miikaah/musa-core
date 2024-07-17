import EventEmitter from "node:events";

export type NormalizationUnit = {
  album: string;
  files: string[];
};

export type NormalizationError = {
  code: number;
  message: string;
};

export type NormalizationResult = {
  albumGainDb?: number;
  albumDynamicRangeDb?: number;
  files: {
    error?: NormalizationError;
    filepath: string;
    targetLevelDb?: number;
    gainDb?: number;
    samplePeak?: number;
    samplePeakDb?: number;
    dynamicRangeDb?: number;
  }[];
};

export type NormalizationResults = Record<string, NormalizationResult>;

// Taken from Electron
interface ForkOptions {
  /**
   * Environment key-value pairs. Default is `process.env`.
   */
  env?: any;
  /**
   * List of string arguments passed to the executable.
   */
  execArgv?: string[];
  /**
   * Current working directory of the child process.
   */
  cwd?: string;
  /**
   * Allows configuring the mode for `stdout` and `stderr` of the child process.
   * Default is `inherit`. String value can be one of `pipe`, `ignore`, `inherit`,
   * for more details on these values you can refer to stdio documentation from
   * Node.js. Currently this option only supports configuring `stdout` and `stderr`
   * to either `pipe`, `inherit` or `ignore`. Configuring `stdin` to any property
   * other than `ignore` is not supported and will result in an error. For example,
   * the supported values will be processed as following:
   */
  stdio?: Array<"pipe" | "ignore" | "inherit"> | string;
  /**
   * Name of the process that will appear in `name` property of `ProcessMetric`
   * returned by `app.getAppMetrics` and `child-process-gone` event of `app`. Default
   * is `Node Utility Process`.
   */
  serviceName?: string;
  /**
   * With this flag, the utility process will be launched via the `Electron Helper
   * (Plugin).app` helper executable on macOS, which can be codesigned with
   * `com.apple.security.cs.disable-library-validation` and
   * `com.apple.security.cs.allow-unsigned-executable-memory` entitlements. This will
   * allow the utility process to load unsigned libraries. Unless you specifically
   * need this capability, it is best to leave this disabled. Default is `false`.
   *
   * @platform darwin
   */
  allowLoadingUnsignedLibraries?: boolean;
}

export interface MessageEvent {
  data: any;
  ports: MessagePortMain[];
}

export declare class MessagePortMain extends EventEmitter {
  // Docs: https://electronjs.org/docs/api/message-port-main

  /**
   * Emitted when the remote end of a MessagePortMain object becomes disconnected.
   */
  on(event: "close", listener: any): this;
  off(event: "close", listener: any): this;
  once(event: "close", listener: any): this;
  addListener(event: "close", listener: any): this;
  removeListener(event: "close", listener: any): this;
  /**
   * Emitted when a MessagePortMain object receives a message.
   */
  on(event: "message", listener: (messageEvent: MessageEvent) => void): this;
  off(event: "message", listener: (messageEvent: MessageEvent) => void): this;
  once(event: "message", listener: (messageEvent: MessageEvent) => void): this;
  addListener(event: "message", listener: (messageEvent: MessageEvent) => void): this;
  removeListener(event: "message", listener: (messageEvent: MessageEvent) => void): this;
  /**
   * Disconnects the port, so it is no longer active.
   */
  close(): void;
  /**
   * Sends a message from the port, and optionally, transfers ownership of objects to
   * other browsing contexts.
   */
  postMessage(message: any, transfer?: MessagePortMain[]): void;
  /**
   * Starts the sending of messages queued on the port. Messages will be queued until
   * this method is called.
   */
  start(): void;
}

export declare class UtilityProcess extends EventEmitter {
  // Docs: https://electronjs.org/docs/api/utility-process

  static fork(modulePath: string, args?: string[], options?: ForkOptions): UtilityProcess;
  /**
   * Emitted after the child process ends.
   */
  on(
    event: "exit",
    listener: (
      /**
       * Contains the exit code for the process obtained from waitpid on posix, or
       * GetExitCodeProcess on windows.
       */
      code: number,
    ) => void,
  ): this;
  off(
    event: "exit",
    listener: (
      /**
       * Contains the exit code for the process obtained from waitpid on posix, or
       * GetExitCodeProcess on windows.
       */
      code: number,
    ) => void,
  ): this;
  once(
    event: "exit",
    listener: (
      /**
       * Contains the exit code for the process obtained from waitpid on posix, or
       * GetExitCodeProcess on windows.
       */
      code: number,
    ) => void,
  ): this;
  addListener(
    event: "exit",
    listener: (
      /**
       * Contains the exit code for the process obtained from waitpid on posix, or
       * GetExitCodeProcess on windows.
       */
      code: number,
    ) => void,
  ): this;
  removeListener(
    event: "exit",
    listener: (
      /**
       * Contains the exit code for the process obtained from waitpid on posix, or
       * GetExitCodeProcess on windows.
       */
      code: number,
    ) => void,
  ): this;
  /**
   * Emitted when the child process sends a message using
   * `process.parentPort.postMessage()`.
   */
  on(event: "message", listener: (message: any) => void): this;
  off(event: "message", listener: (message: any) => void): this;
  once(event: "message", listener: (message: any) => void): this;
  addListener(event: "message", listener: (message: any) => void): this;
  removeListener(event: "message", listener: (message: any) => void): this;
  /**
   * Emitted once the child process has spawned successfully.
   */
  on(event: "spawn", listener: any): this;
  off(event: "spawn", listener: any): this;
  once(event: "spawn", listener: any): this;
  addListener(event: "spawn", listener: any): this;
  removeListener(event: "spawn", listener: any): this;
  /**
   * Terminates the process gracefully. On POSIX, it uses SIGTERM but will ensure the
   * process is reaped on exit. This function returns true if the kill is successful,
   * and false otherwise.
   */
  kill(): boolean;
  /**
   * Send a message to the child process, optionally transferring ownership of zero
   * or more `MessagePortMain` objects.
   *
   * For example:
   */
  postMessage(message: any, transfer?: MessagePortMain[]): void;
  /**
   * A `Integer | undefined` representing the process identifier (PID) of the child
   * process. If the child process fails to spawn due to errors, then the value is
   * `undefined`. When the child process exits, then the value is `undefined` after
   * the `exit` event is emitted.
   */
  pid: number | undefined;
  /**
   * A `NodeJS.ReadableStream | null` that represents the child process's stderr. If
   * the child was spawned with options.stdio[2] set to anything other than 'pipe',
   * then this will be `null`. When the child process exits, then the value is `null`
   * after the `exit` event is emitted.
   */
  stderr: NodeJS.ReadableStream | null;
  /**
   * A `NodeJS.ReadableStream | null` that represents the child process's stdout. If
   * the child was spawned with options.stdio[1] set to anything other than 'pipe',
   * then this will be `null`. When the child process exits, then the value is `null`
   * after the `exit` event is emitted.
   */
  stdout: NodeJS.ReadableStream | null;
}
