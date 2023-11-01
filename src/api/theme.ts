import * as Db from "../db";

import { Colors, DbTheme } from "../db.types";
import { Theme } from "./theme.types";

export const getAllThemes = async () => {
  return (await Db.getAllThemes()).map(toApiTheme);
};

export const getTheme = async (id: string) => {
  const theme = await Db.getTheme(id);

  if (!theme) {
    throw new Error("Theme Not Found");
  }

  return toApiTheme(theme);
};

export const insertTheme = async (id: string, colors: Colors) => {
  return toApiTheme(await Db.insertTheme(id, colors));
};

export const updateTheme = async (id: string, colors: Colors) => {
  return toApiTheme(await Db.updateTheme(id, colors));
};

export const removeTheme = async (id: string) => {
  await Db.removeTheme(id);
};

function toApiTheme({ path_id, filename, colors }: DbTheme): Theme {
  return { id: path_id, filename, colors };
}
