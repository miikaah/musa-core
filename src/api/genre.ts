import { getAllGenres as getAllGenresFromDb } from "../db";

export const getAllGenres = async () => {
  return getAllGenresFromDb();
};
