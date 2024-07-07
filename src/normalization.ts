import { Results, Unit } from "./normalization.types";
import { calculateLoudness } from "./normalization/main";

export const normalizeMany = async (units: Unit[]): Promise<Results> => {
  // Iterating through synchronously to get maximum throughput per album.
  // The calculateLoudness function runs the tracks in parallel.
  const results: Results = {};
  for (const unit of units) {
    results[unit.album] = await calculateLoudness(unit.files);
  }

  return results;
};
