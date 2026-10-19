/** Unicode-aware keyword matching. Multiword phrases count as one occurrence.
 * Density = phrase occurrences / text word count × 100; it is not a ranking signal. */
export function words(text) {
  return String(text).match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}
export function parseKeywords(input) {
  const entries = Array.isArray(input) ? input : String(input).split(/[,\n]/);
  return [
    ...new Set(
      entries
        .map((x) => String(x).trim().toLowerCase())
        .filter((x) => words(x).length),
    ),
  ].slice(0, 30);
}
export function keywordMetrics(text, input) {
  const tokens = words(text).map((x) => x.toLowerCase()),
    keys = parseKeywords(input);
  const rows = keys.map((keyword) => {
    const phrase = words(keyword).map((x) => x.toLowerCase());
    let count = 0;
    for (let i = 0; i <= tokens.length - phrase.length; i++)
      if (phrase.every((x, j) => tokens[i + j] === x)) count++;
    return {
      keyword,
      count,
      density: tokens.length ? (count / tokens.length) * 100 : 0,
    };
  });
  return {
    rows,
    coverage: rows.length
      ? (rows.filter((x) => x.count).length / rows.length) * 100
      : null,
    wordCount: tokens.length,
  };
}
