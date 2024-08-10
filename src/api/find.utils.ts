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
const replaceSpecialCharsWithEt: [RegExp, string] = [/&/g, "et"];
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
    .replace(...replaceSpecialCharsWithEt)
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
