import { NormalizationResults, NormalizationUnit } from "./normalization.types";
import { calculateLoudness } from "./normalization/main";

export const normalizeMany = async (
  units: NormalizationUnit[],
): Promise<NormalizationResults> => {
  const results: NormalizationResults = {};

  // const listOfResults = await Promise.all(
  //   units.map(async (unit) => {
  //     const now = new Date();
  //     console.log(now.toISOString(), unit.album, "start");
  //     const result = await calculateLoudness(unit.files);
  //     console.log(new Date().toISOString(), unit.album, "end");
  //     console.log(
  //       new Date().toISOString(),
  //       unit.album,
  //       `Took: ${(Date.now() - now.getTime()) / 1000} seconds`,
  //     );
  //     return [unit.album, result] as [string, NormalizationResult];
  //   }),
  // );

  // for (const [album, result] of listOfResults) {
  //   results[album] = result;
  // }

  for (const unit of units) {
    const now = new Date();
    console.log(now.toISOString(), unit.album, "start");
    results[unit.album] = await calculateLoudness(unit.files);
    console.log(new Date().toISOString(), unit.album, "end");
    console.log(
      new Date().toISOString(),
      unit.album,
      `Took: ${(Date.now() - now.getTime()) / 1000} seconds`,
    );
  }

  return results;
};
