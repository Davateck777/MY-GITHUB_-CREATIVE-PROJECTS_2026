/** Saved-draft page: search, sorting, editing, duplication, backup, and confirmed deletion. */
import {
  drafts,
  write,
  deleteDraft,
  duplicateDraft,
  saveDraft,
} from "./storage.js";
import { analyzeDraft } from "./analysis.js";
import {
  makeBackup,
  parseBackup,
  draftText,
  download,
} from "./exportImport.js";
import { el, notify, attempt, dateLabel } from "./ui.js";
const $ = (id) => document.getElementById(id);
function button(label, fn, cls = "") {
  const b = el("button", `btn ${cls}`, label);
  b.onclick = fn;
  return b;
}
function render() {
  const all = drafts(),
    q = $("search").value.toLowerCase(),
    sort = $("sort").value;
  const items = all.filter((d) =>
    [d.name, d.headline, d.role, d.about].some((x) =>
      String(x).toLowerCase().includes(q),
    ),
  );
  items.sort(
    sort === "name"
      ? (a, b) => a.name.localeCompare(b.name)
      : sort === "score"
        ? (a, b) => analyzeDraft(b).score - analyzeDraft(a).score
        : (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  );
  const list = $("draft-list");
  list.replaceChildren();
  if (!items.length) {
    const box = el("div", "empty");
    box.append(
      el("div", "empty-icon", "✦"),
      el(
        "h2",
        "",
        all.length ? "No matching drafts" : "Your story starts here.",
      ),
      el(
        "p",
        "",
        all.length
          ? "Try a different search."
          : "Save your first profile from the Optimizer.",
      ),
    );
    const a = el("a", "btn primary", "Open the Optimizer ↗");
    a.href = "optimizer.html";
    box.append(a);
    list.append(box);
    return;
  }
  for (const d of items) {
    const card = el("article", "draft-card"),
      info = el("div", "draft-info");
    info.append(
      el("h2", "", d.name),
      el("p", "", d.headline || "No headline yet"),
      el(
        "span",
        "draft-meta",
        `Updated ${dateLabel(d.updatedAt)} · Writing score ${analyzeDraft(d).score}/100 (default limits)`,
      ),
    );
    const actions = el("div", "draft-actions");
    const edit = el("a", "btn primary", "Edit ↗");
    edit.href = `optimizer.html?edit=${encodeURIComponent(d.id)}`;
    actions.append(
      edit,
      button("Rename", () => {
        const name = prompt("Draft name", d.name);
        if (name === null) return;
        if (!name.trim() || name.length > 120) {
          notify("Use a draft name from 1 to 120 characters.", true);
          return;
        }
        if (attempt(() => saveDraft({ ...d, name: name.trim() }))) render();
      }),
      button("Duplicate", () => {
        if (attempt(() => duplicateDraft(d))) {
          render();
          notify("Draft duplicated.");
        }
      }),
      button("Text ↓", () =>
        download(draftText(d), "profilecraft-profile.txt"),
      ),
      button(
        "Delete",
        () => {
          if (
            confirm(`Delete “${d.name}”? This cannot be undone.`) &&
            attempt(() => {
              deleteDraft(d.id);
              return true;
            })
          ) {
            render();
            notify("Draft deleted.");
          }
        },
        "danger",
      ),
    );
    card.append(info, actions);
    list.append(card);
  }
}
$("search").oninput = render;
$("sort").onchange = render;
$("backup").onclick = () => {
  download(
    makeBackup(drafts()),
    "profilecraft-backup.json",
    "application/json",
  );
  notify("Backup prepared. Keep it somewhere safe.");
};
$("import").onclick = () => $("import-file").click();
$("import-file").onchange = async () => {
  const input = $("import-file"),
    file = input.files[0];
  if (!file) return;
  try {
    if (file.size > 5_000_000)
      throw new Error("Backup exceeds the 5 MB limit.");
    const incoming = parseBackup(await file.text());
    if (!incoming.length) {
      notify("This backup contains no drafts.");
      return;
    }
    const existing = drafts(),
      replacements = incoming.filter((x) =>
        existing.some((y) => x.id === y.id),
      ).length;
    if (
      !confirm(
        `Import ${incoming.length} drafts? ${replacements} matching saved drafts will be replaced.`,
      )
    )
      return;
    const map = new Map(existing.map((x) => [x.id, x]));
    for (const d of incoming) map.set(d.id, d);
    write("drafts", [...map.values()]);
    render();
    notify(`${incoming.length} drafts imported.`);
  } catch (e) {
    notify(e.message, true);
  } finally {
    input.value = "";
  }
};
render();
