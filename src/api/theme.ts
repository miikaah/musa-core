import * as Db from "../db";
import { Colors, DbTheme } from "../db.types";
import { Theme } from "./theme.types";

export const getAllThemes = async (): Promise<Theme[]> => {
  return (await Db.getAllThemes()).map(toApiTheme);
};

export const getTheme = async (id: string): Promise<Theme> => {
  const theme = await Db.getTheme(id);

  if (!theme) {
    throw new Error("Theme Not Found");
  }

  return toApiTheme(theme);
};

export const insertTheme = async (id: string, colors: Colors): Promise<Theme> => {
  return toApiTheme(await Db.insertTheme(id, colors));
};

export const updateTheme = async (id: string, colors: Colors): Promise<Theme> => {
  return toApiTheme(await Db.updateTheme(id, colors));
};

export const removeTheme = async (id: string): Promise<void> => {
  await Db.removeTheme(id);
};

function toApiTheme({ path_id, filename, colors }: DbTheme): Theme {
  return { id: path_id, filename, colors };
}
