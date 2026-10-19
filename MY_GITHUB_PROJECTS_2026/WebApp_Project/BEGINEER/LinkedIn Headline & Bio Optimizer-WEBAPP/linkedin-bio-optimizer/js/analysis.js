/** Pure, deterministic writing checks. Scores describe these rules only, never LinkedIn ranking. */
import { words, keywordMetrics } from "./keywords.js";
export const DEFAULT_LIMITS = { headline: 220, about: 2600 };
export function charCount(text) {
  return Array.from(String(text)).length;
}
export function analyzeField(
  text,
  kind,
  keywords,
  limit = DEFAULT_LIMITS[kind],
) {
  const count = charCount(text),
    metrics = keywordMetrics(text, keywords);
  const sentences = text
    .split(/[.!?]+(?:\s|$)/)
    .map((x) => x.trim())
    .filter(Boolean);
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const longSentences = sentences.filter((x) => words(x).length > 30).length;
  const longParagraphs = paragraphs.filter((x) => words(x).length > 80).length;
  const repeated = metrics.rows.filter((x) => x.count >= 3 && x.density > 5);
  const generic =
    text.match(
      /\b(?:guru|ninja|rockstar|results[- ]driven|thought leader|synergy)\b/gi,
    ) || [];
  const checks = [
    {
      label: "Length",
      weight: 25,
      value: count > 0 && count <= limit ? 100 : 0,
      detail: `${count} / ${limit} characters`,
    },
    {
      label: "Keyword coverage",
      weight: 30,
      value: metrics.coverage,
      detail:
        metrics.coverage === null
          ? "Add target keywords to evaluate this check."
          : `${Math.round(metrics.coverage)}% of your selected terms appear.`,
    },
    {
      label: "Readability",
      weight: 25,
      value: count
        ? Math.max(0, 100 - longSentences * 20 - longParagraphs * 25)
        : 0,
      detail: `${longSentences} long sentences · ${longParagraphs} long paragraphs`,
    },
    {
      label: "Specific language",
      weight: 20,
      value: count
        ? Math.max(0, 100 - generic.length * 20 - repeated.length * 25)
        : 0,
      detail: `${generic.length} generic phrases · ${repeated.length} repeated keywords`,
    },
  ];
  const active = checks.filter((x) => x.value !== null),
    weight = active.reduce((s, x) => s + x.weight, 0);
  const score = count
    ? Math.round(active.reduce((s, x) => s + x.value * x.weight, 0) / weight)
    : 0;
  const suggestions = [];
  if (!count)
    suggestions.push(
      `Write your ${kind === "about" ? "About section" : "headline"} to get feedback.`,
    );
  if (count > limit)
    suggestions.push(
      `Trim ${count - limit} characters to fit the configured limit.`,
    );
  const missing = metrics.rows.filter((x) => !x.count);
  if (missing.length)
    suggestions.push(
      `Consider naturally including: ${missing.map((x) => x.keyword).join(", ")}.`,
    );
  if (longSentences)
    suggestions.push("Break sentences over 30 words into shorter ideas.");
  if (longParagraphs)
    suggestions.push("Split paragraphs over 80 words for easier scanning.");
  if (generic.length)
    suggestions.push(
      "Replace generic phrases with specific expertise or evidence.",
    );
  if (repeated.length)
    suggestions.push("Reduce repeated keywords; prioritise natural language.");
  if (kind === "headline" && count && !/[|:—–]/.test(text))
    suggestions.push(
      "Try separating your role, speciality, and value with a divider.",
    );
  if (
    kind === "about" &&
    count &&
    !/\b(contact|connect|message|reach|email|let.s talk)\b/i.test(text)
  )
    suggestions.push("Consider ending with a clear invitation to connect.");
  return {
    count,
    limit,
    score,
    checks,
    metrics,
    suggestions,
    longSentences,
    longParagraphs,
  };
}
export function analyzeDraft(draft, limits = DEFAULT_LIMITS) {
  const headline = analyzeField(
    draft.headline || "",
    "headline",
    draft.keywords || "",
    limits.headline,
  );
  const about = analyzeField(
    draft.about || "",
    "about",
    draft.keywords || "",
    limits.about,
  );
  return {
    headline,
    about,
    score: Math.round((headline.score + about.score) / 2),
  };
}
