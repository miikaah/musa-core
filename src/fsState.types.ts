export type State = {
  isInit: boolean | null;
  currentTheme: {
    id: string;
    filename?: string;
    colors: {
      bg: number[];
      primary: number[];
      secondary: number[];
      slider: number[];
      typography: string;
      typographyGhost: string;
      typographyPrimary: string;
      typographySecondary: string;
    };
  };
  replaygainType: string;
  volume: number;
  musicLibraryPath: string;
  key?: string;
};
