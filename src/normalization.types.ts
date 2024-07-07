export type Unit = {
  album: string;
  files: string[];
};

export type Result = {
  albumGainDb: number;
  albumDynamicRangeDb: number;
  files: {
    filepath: string;
    targetLevelDb: number;
    gainDb: number;
    samplePeak: number;
    dynamicRangeDb: number;
  }[];
};

export type Results = Record<string, Result>;
