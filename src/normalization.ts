import { NormalizationResults, NormalizationUnit } from "./normalization.types";
import { calculateLoudness } from "./normalization/main";

export const normalizeMany = async (
  units: NormalizationUnit[],
): Promise<NormalizationResults> => {
  // Iterating through synchronously to get maximum throughput per album.
  // The calculateLoudness function runs the tracks in parallel.
  const results: NormalizationResults = {};
  for (const unit of units) {
    results[unit.album] = await calculateLoudness(unit.files);
  }

  return results;
};
