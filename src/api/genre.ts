import { getAllGenres as getAllGenresFromDb } from "../db";

export const getAllGenres = async (): Promise<string[]> => {
  return getAllGenresFromDb();
};
