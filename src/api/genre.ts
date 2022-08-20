import { getAllGenres as getAllGenresFromDb } from "../db";

export const getAllGenres = async () => {
  console.log(await getAllGenresFromDb());
  return getAllGenresFromDb();
};
