export type NormalizationUnit = {
  album: string;
  files: string[];
};

export type NormalizationError = {
  code: number;
  message: string;
};

export type NormalizationResult = {
  albumGainDb?: number;
  albumDynamicRangeDb?: number;
  files: {
    error?: NormalizationError;
    filepath: string;
    targetLevelDb?: number;
    gainDb?: number;
    samplePeak?: number;
    samplePeakDb?: number;
    dynamicRangeDb?: number;
  }[];
};

export type NormalizationResults = Record<string, NormalizationResult>;
