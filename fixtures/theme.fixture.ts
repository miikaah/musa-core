import { Theme } from "../src/api/theme.types";
import { DbTheme } from "../src/db.types";

export const themeFixture: Theme = {
  id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
  filename: "Alamaailman vasarat/Vasaraasia/Vasaraasia.jpg",
  colors: {
    bg: [19, 20, 15],
    primary: [210, 83, 24],
    secondary: [69, 68, 42],
    typography: "#fbfbfb",
    typographyGhost: "#d2d2d2",
    typographyPrimary: "#fbfbfb",
    typographySecondary: "#fbfbfb",
    slider: [210, 83, 24],
  },
};

export const themeDbFixture: DbTheme = {
  path_id: "QWxhbWFhaWxtYW4gdmFzYXJhdC9WYXNhcmFhc2lhL1Zhc2FyYWFzaWEuanBn",
  filename: "Alamaailman vasarat/Vasaraasia/Vasaraasia.jpg",
  colors: {
    bg: [19, 20, 15],
    primary: [210, 83, 24],
    secondary: [69, 68, 42],
    typography: "#fbfbfb",
    typographyGhost: "#d2d2d2",
    typographyPrimary: "#fbfbfb",
    typographySecondary: "#fbfbfb",
    slider: [210, 83, 24],
  },
  modified_at: "2022-06-08T15:00:16.896Z",
};
