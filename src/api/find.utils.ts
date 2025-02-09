import { calculateOkapiBm25Score } from "../fullTextSearch";
import { findAudioInCollectionById } from "../mediaCollection";
import { AlbumWithFilesAndMetadata } from "./album.types";
import { AudioWithMetadata } from "./audio.types";

const adversarialChars: [RegExp, string] = [
  /[.,;:{}()<>/\\|[\]_\-~^¨*`´“"”'∞§≈±™˙ﬁ…–ıª√’˛‘¸›®ƒ‹•≤¶©]/g,
  "",
];
const replaceSpecialCharsWithE: [RegExp, string] = [/[éÉ€]/g, "e"];
const replaceSpecialCharsWithA: [RegExp, string] = [/[äÄæ]/g, "a"];
const replaceSpecialCharsWithO: [RegExp, string] = [/[öÖåÅøœΩ]/g, "o"];
const replaceSpecialCharsWithU: [RegExp, string] = [/[üÜ]/g, "u"];
const replaceSpecialCharsWithC: [RegExp, string] = [/[çÇ]/g, "c"];
const replaceSpecialCharsWithAt: [RegExp, string] = [/[@†]/g, "at"];
const replaceSpecialCharsWithAnd: [RegExp, string] = [/&/g, "and"];
const replaceSpecialCharsWithS: [RegExp, string] = [/[$ß]/g, "s"];
const replaceSpecialCharsWithL: [RegExp, string] = [/£/g, "l"];
const replaceSpecialCharsWithM: [RegExp, string] = [/µ/g, "m"];
const replaceSpecialCharsWithP: [RegExp, string] = [/[%π]/g, "p"];
const replaceSpecialCharsWithIs: [RegExp, string] = [/=/g, "is"];
const removeQuestionMark: [RegExp, string] = [/\?(?!$)/g, ""];
const removeExclamationMark: [RegExp, string] = [/!(?=.)/g, ""];

export const normalizeSearchString = (query: string) => {
  return query
    .replace(...adversarialChars)
    .replace(...replaceSpecialCharsWithE)
    .replace(...replaceSpecialCharsWithA)
    .replace(...replaceSpecialCharsWithO)
    .replace(...replaceSpecialCharsWithU)
    .replace(...replaceSpecialCharsWithC)
    .replace(...replaceSpecialCharsWithAt)
    .replace(...replaceSpecialCharsWithAnd)
    .replace(...replaceSpecialCharsWithS)
    .replace(...replaceSpecialCharsWithL)
    .replace(...replaceSpecialCharsWithM)
    .replace(...replaceSpecialCharsWithP)
    .replace(...replaceSpecialCharsWithIs)
    .replace(...removeQuestionMark)
    .replace(...removeExclamationMark)
    .toLowerCase()
    .trim();
};

export const getAudios = (
  audios: (AudioWithMetadata | undefined)[],
): AudioWithMetadata[] => {
  return audios
    .filter((audio) => !!audio)
    .filter((audio) => !!findAudioInCollectionById(audio.id));
};

export const getAlbums = (
  albums: (AlbumWithFilesAndMetadata | undefined)[],
): AlbumWithFilesAndMetadata[] => {
  const filteredAlbums = albums.filter((album) => !!album).filter((album) => album.name);

  filteredAlbums.forEach((album) => {
    album.files.sort(byTrackAsc);
  });

  return filteredAlbums;
};

export function getAlbumSortFn({
  isArtistSearch,
  isAlbumSearch,
  uniqAlbumArtists,
  terms,
  k1,
  b,
}: {
  isArtistSearch: boolean;
  isAlbumSearch: boolean;
  uniqAlbumArtists: string[];
  terms: string[];
  k1: number;
  b: number;
}) {
  if (isArtistSearch || isAlbumSearch) {
    // Disable sorting when using artist or album search
    return () => 0;
  } else {
    return uniqAlbumArtists.length > 1 ? byOkapiBm25(terms, k1, b) : byYearAsc;
  }
}

export function byYearAsc(a: AlbumWithFilesAndMetadata, b: AlbumWithFilesAndMetadata) {
  return Number(a.metadata.year) - Number(b.metadata.year);
}

export function getAudioSortFn({
  isArtistSearch,
  isAlbumSearch,
  uniqAlbums,
  terms,
  k1,
  b,
}: {
  isArtistSearch: boolean;
  isAlbumSearch: boolean;
  uniqAlbums: AlbumWithFilesAndMetadata[];
  terms: string[];
  k1: number;
  b: number;
}) {
  if (isArtistSearch) {
    // Disable sorting when using artist search
    return () => 0;
  } else if (isAlbumSearch) {
    return byTrackAsc;
  } else {
    return uniqAlbums.length > 1 ? byOkapiBm25(terms, k1, b) : byTrackAsc;
  }
}

export function byTrackAsc(a: AudioWithMetadata, b: AudioWithMetadata) {
  const aTrack = `${a.metadata.track?.no}`.padStart(2, "0");
  const bTrack = `${b.metadata.track?.no}`.padStart(2, "0");
  const aDisk = a.metadata.disk?.no;
  const bDisk = b.metadata.disk?.no;
  const aTrackNo = aDisk ? Number(`${aDisk}${aTrack}`) : Number(aTrack);
  const bTrackNo = bDisk ? Number(`${bDisk}${bTrack}`) : Number(bTrack);

  return aTrackNo - bTrackNo;
}

/** NOTE: Scanning needs to be enabled for fulltext search to be enabled */
export function byOkapiBm25(terms: string[], k1: number, b: number, isArtist = false) {
  // @ts-expect-error not useful here
  return (a, c) => {
    const tca = (isArtist ? a.name : a?.metadata?.title) || "";
    const tcc = (isArtist ? c.name : c?.metadata?.title) || "";

    if (!tca || !tcc) {
      return 1;
    }

    const aScore = terms
      .map((term) => calculateOkapiBm25Score(term, tca.length, k1, b))
      .reduce((acc, score) => acc + score, 0);
    const cScore = terms
      .map((term) => calculateOkapiBm25Score(term, tcc.length, k1, b))
      .reduce((acc, score) => acc + score, 0);

    if (aScore === 0 && cScore === 0 && tca.toLowerCase().startsWith(terms[0])) {
      return -1;
    }

    return cScore - aScore;
  };
}

export function getRandomNumber(max: number) {
  return Math.floor(Math.random() * max);
}

export function getRandomNumbers(max: number, amount: number) {
  const randomNumbers: number[] = [];

  while (randomNumbers.length < Math.min(amount, max)) {
    const candidate = getRandomNumber(max);

    if (!randomNumbers.includes(candidate)) {
      randomNumbers.push(candidate);
    }
  }

  return randomNumbers;
}

export function lookupEntities<T>(entitiesForFind: T[], indices: number[]): T[] {
  const entities: (T | undefined)[] = [];

  for (const index of indices) {
    entities.push(entitiesForFind.at(index));
  }

  return entities.filter(Boolean) as T[];
}
