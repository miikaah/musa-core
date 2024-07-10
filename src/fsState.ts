import fs from "fs/promises";
import path from "path";
import { musadir } from "./config";
import { State } from "./fsState.types";

export const setState = async (
  stateFile: string,
  state: Partial<State>,
): Promise<void> => {
  return fs.writeFile(path.join(musadir, stateFile), JSON.stringify(state, null, 2));
};

export const getState = async (
  stateFile: string,
): Promise<Partial<State> | undefined> => {
  const file = await fs
    .readFile(path.join(musadir, stateFile), { encoding: "utf-8" })
    .catch((err) => {
      console.error("State file doesn't exist", err);
      return "{}";
    });

  let state;
  try {
    // HACK: There is some weird bug here that sometimes file is empty
    //       maybe due to some race-condition? as a hack just try to get it again
    if (!file) {
      return getState(stateFile);
    }
    state = JSON.parse(file);
  } catch (e) {
    console.error("State file is not JSON", e);
    return { musicLibraryPath: "" };
  }

  return state;
};
