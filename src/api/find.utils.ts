const adversarialChars: [RegExp, string] = [/[';:{}<>\\|[\]]/g, ""];
const replaceÉWithE: [RegExp, string] = [/[éÉ]/g, "e"];
const replaceÄWithA: [RegExp, string] = [/[äÄ]/g, "a"];
const replaceÖWithO: [RegExp, string] = [/[öÖåÅ]/g, "o"];
const replaceÜWithU: [RegExp, string] = [/[üÜ]/g, "u"];
const replaceÇWithC: [RegExp, string] = [/[çÇ]/g, "c"];
const removeQuestionMark: [RegExp, string] = [/\?(?!$)/g, ""];
const removeExclamation: [RegExp, string] = [/!(!!$)/g, ""];

export const normalizeSearchString = (query: string) => {
  return query
    .replace("artist:", "")
    .replace("album:", "")
    .replace(...adversarialChars)
    .replace(...replaceÉWithE)
    .replace(...replaceÄWithA)
    .replace(...replaceÖWithO)
    .replace(...replaceÜWithU)
    .replace(...replaceÇWithC)
    .replace(...removeQuestionMark)
    .replace(...removeExclamation)
    .toLowerCase()
    .trim();
};
