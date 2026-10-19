/** Editor controller: autosave a working copy, explicitly save named versions, render feedback. */
import { analyzeDraft, DEFAULT_LIMITS } from "./analysis.js";
import { read, write, drafts, saveDraft } from "./storage.js";
import { el, notify, attempt, copy } from "./ui.js";
import { draftText, download } from "./exportImport.js";
import { templates } from "./templates.js";
import { renderPreview, setupPreview } from "./preview.js";
const fields = ["name", "role", "audience", "headline", "about", "keywords"];
const blank = () => ({
  name: "Untitled profile",
  role: "",
  audience: "",
  headline: "",
  about: "",
  keywords: "",
});
const $ = (id) => document.getElementById(id);
let draft = blank(),
  field = "headline",
  currentAnalysis;
let limits = read("limits", DEFAULT_LIMITS);
for (const k of ["headline", "about"]) {
  if (!Number.isInteger(limits?.[k]) || limits[k] < 1 || limits[k] > 20000)
    limits = { ...DEFAULT_LIMITS };
  $(k + "-limit").value = limits[k];
}
const query = new URLSearchParams(location.search),
  saved = drafts().find((x) => x.id === query.get("edit"));
if (saved) draft = { ...saved };
else if (!query.has("new")) {
  const working = read("working", null);
  if (working && fields.every((k) => typeof working[k] === "string"))
    draft = working;
}
if (query.has("edit") && !saved)
  notify("That draft was not found. Starting a new profile.", true);
for (const k of fields) $(k).value = draft[k];
function gather() {
  for (const k of fields) draft[k] = $(k).value;
  return draft;
}
function persist() {
  const success = attempt(() => {
    write("working", gather());
    return true;
  });
  $("save-status").textContent = success
    ? "Working copy autosaved locally"
    : "Autosave unavailable — export your text";
}
function comparison() {
  const base = drafts().find((x) => x.id === $("baseline").value),
    box = $("comparison-result");
  box.replaceChildren();
  if (!base) {
    box.textContent =
      "Choose a saved baseline to compare with your current text.";
    return;
  }
  const b = analyzeDraft(base, limits);
  const list = el("div", "comparison-lines");
  for (const [label, before, after] of [
    ["Writing score", b.score, currentAnalysis.score],
    ["Headline characters", b.headline.count, currentAnalysis.headline.count],
    ["About characters", b.about.count, currentAnalysis.about.count],
  ]) {
    const line = el("div", "", `${label}: ${before} → ${after} `);
    line.append(
      el("strong", "", `(${after - before >= 0 ? "+" : ""}${after - before})`),
    );
    list.append(line);
  }
  box.append(list);
  box.append(
    el(
      "p",
      "field-help",
      "Both versions use your current length limits and their own keywords. Score changes are not performance predictions.",
    ),
  );
}
function baselines() {
  const select = $("baseline"),
    selected = select.value;
  select.replaceChildren(el("option", "", "Choose a baseline…"));
  select.firstChild.value = "";
  for (const d of drafts()) {
    const o = el("option", "", d.name);
    o.value = d.id;
    select.append(o);
  }
  select.value = selected;
}
function render() {
  currentAnalysis = analyzeDraft(gather(), limits);
  for (const key of ["headline", "about"]) {
    const a = currentAnalysis[key];
    $(key + "-count").textContent =
      `${a.count.toLocaleString()} / ${a.limit.toLocaleString()}`;
    $(key + "-count").classList.toggle("over", a.count > a.limit);
    $(key).setAttribute("aria-invalid", String(a.count > a.limit));
  }
  $("word-count").textContent =
    `${currentAnalysis.about.metrics.wordCount} words`;
  $("score").textContent = currentAnalysis.score;
  $("score-ring").style.setProperty("--score", currentAnalysis.score);
  $("score-label").textContent =
    currentAnalysis.score >= 85
      ? "Looking clear & focused"
      : currentAnalysis.score >= 60
        ? "Taking shape"
        : currentAnalysis.score
          ? "Room to refine"
          : "A fresh start";
  const a = currentAnalysis[field],
    checks = $("checks");
  checks.replaceChildren();
  for (const c of a.checks) {
    const row = el("div", "check");
    row.append(
      el("span", "check-label", c.label),
      el(
        "span",
        "check-value",
        c.value === null ? "Not evaluated" : `${Math.round(c.value)}/100`,
      ),
    );
    const track = el("div", "track");
    const fill = el("span");
    fill.style.width = `${c.value || 0}%`;
    track.append(fill);
    row.append(track, el("small", "", c.detail));
    checks.append(row);
  }
  $("coverage").textContent =
    a.metrics.coverage === null
      ? "No keywords yet"
      : `${Math.round(a.metrics.coverage)}% coverage`;
  const chips = $("keyword-chips");
  chips.replaceChildren();
  for (const k of a.metrics.rows)
    chips.append(
      el(
        "span",
        `chip ${k.count ? "found" : ""}`,
        `${k.keyword} · ${k.count} · ${k.density.toFixed(1)}%`,
      ),
    );
  if (!a.metrics.rows.length)
    chips.append(
      el("span", "muted", "Add terms you want this field to communicate."),
    );
  const suggestions = $("suggestions");
  suggestions.replaceChildren();
  for (const s of a.suggestions.length
    ? a.suggestions
    : [
        "No rule-based flags. Review your specificity and accuracy before publishing.",
      ])
    suggestions.append(el("li", "", s));
  renderPreview(draft);
  comparison();
}
for (const k of fields)
  $(k).addEventListener("input", () => {
    render();
    persist();
  });
for (const b of document.querySelectorAll("[data-field]"))
  b.onclick = () => {
    field = b.dataset.field;
    for (const x of document.querySelectorAll("[data-field]"))
      x.setAttribute("aria-pressed", String(x === b));
    render();
  };
for (const k of ["headline", "about"])
  $(k + "-limit").addEventListener("change", () => {
    const v = Number($(k + "-limit").value);
    if (!Number.isInteger(v) || v < 1 || v > 20000) {
      notify("Choose a whole-number limit between 1 and 20,000.", true);
      $(k + "-limit").value = limits[k];
      return;
    }
    limits = { ...limits, [k]: v };
    attempt(() => write("limits", limits));
    render();
  });
$("baseline").onchange = comparison;
$("save-draft").onclick = () => {
  gather();
  if (!draft.headline.trim() && !draft.about.trim()) {
    notify("Write a headline or About section before saving.", true);
    return;
  }
  if (!draft.name.trim()) {
    notify("Give this draft a name.", true);
    $("name").focus();
    return;
  }
  const item = attempt(() => saveDraft({ ...draft, name: draft.name.trim() }));
  if (item) {
    draft = item;
    $("name").value = draft.name;
    persist();
    baselines();
    render();
    notify("Named draft saved. Find it in Saved drafts.");
  }
};
$("new-draft").onclick = () => {
  if (
    (draft.headline || draft.about) &&
    !confirm(
      "Start a new working copy? Unsaved changes to this version will be replaced. Saved drafts stay safe.",
    )
  )
    return;
  draft = blank();
  for (const k of fields) $(k).value = draft[k];
  history.replaceState(null, "", "optimizer.html");
  render();
  persist();
  $("headline").focus();
};
$("copy-headline").onclick = () => copy(gather().headline);
$("copy-about").onclick = () => copy(gather().about);
$("export-text").onclick = () => {
  gather();
  download(draftText(draft), "profilecraft-profile.txt");
  notify("Text export prepared.");
};
$("apply-template").onclick = () => {
  const t = templates[$("template").value];
  if (!t) {
    notify("Choose a template first.", true);
    return;
  }
  if (
    (draft.headline || draft.about) &&
    !confirm("Replace your current headline and About text with this template?")
  )
    return;
  for (const k of ["headline", "about"]) $(k).value = t[k];
  render();
  persist();
  notify("Template applied. Replace the placeholders with truthful details.");
};
setupPreview(() => draft);
baselines();
render();
if (query.has("new")) persist();
