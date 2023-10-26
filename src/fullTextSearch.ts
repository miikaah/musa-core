// See: https://en.wikipedia.org/wiki/Tf%E2%80%93idf
//      https://en.wikipedia.org/wiki/Okapi_BM25
//      https://burakkanber.com/blog/machine-learning-full-text-search-in-javascript-relevance-scoring/

export const tokenize = (str: string): string[] => {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((s) => s.trim().replaceAll("(", "").replaceAll(")", ""))
    .flat(Infinity);
};

export const termFrequency: Record<string, number> = {};

export const updateTf = (terms: string[]) => {
  terms.forEach((term) => {
    const exists = termFrequency[term];

    if (exists) {
      termFrequency[term] = (termFrequency[term] || 0) + 1;
    } else {
      termFrequency[term] = 1;
    }
  });
};

export const getTfInDescOrder = () => {
  return Object.entries(termFrequency).sort((a, b) => b[1] - a[1]);
};

export const inverseDocumentFrequency: Record<string, number> = {};
export const tfIdf: Record<string, number> = {};
export let averageDocLength = 0;

export const updateParams = (totalDocuments: number) => {
  Object.entries(termFrequency).forEach(([term, tf]) => {
    inverseDocumentFrequency[term] = Math.log(totalDocuments / (tf + 0.5));
    tfIdf[term] = tf * inverseDocumentFrequency[term];
  });

  averageDocLength = Object.keys(termFrequency).length / (totalDocuments || 1);
};

export const getIdfInDescOrder = () => {
  return Object.entries(inverseDocumentFrequency).sort((a, b) => b[1] - a[1]);
};

export const getTfIdfInDescOrder = () => {
  return Object.entries(tfIdf).sort((a, b) => a[1] - b[1]);
};

export const calculateOkapiBm25Score = (
  term: string,
  tc: number,
  k1: number,
  b: number,
) => {
  if (!termFrequency[term]) {
    return 0;
  }
  const tf = termFrequency[term];
  const idf = inverseDocumentFrequency[term];
  const numerator = tf * (k1 + 1);
  const denominator = tf + k1 * (1 - b + (b * tc) / averageDocLength);

  return (idf * numerator) / denominator;
};
