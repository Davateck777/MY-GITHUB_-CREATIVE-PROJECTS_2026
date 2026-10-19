/** Browser-local persistence with explicit errors; no silent fallback that pretends to save. */
const PREFIX = "profilecraft.v1.";
export function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    throw new Error(
      "Browser storage is unavailable or full. Export a backup before closing this page.",
    );
  }
}
export function drafts() {
  const value = read("drafts", []);
  return Array.isArray(value) ? value : [];
}
export function saveDraft(draft) {
  const all = drafts(),
    i = all.findIndex((x) => x.id === draft.id);
  const item = {
    ...draft,
    id: draft.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  if (i < 0) all.unshift(item);
  else all[i] = item;
  write("drafts", all);
  return item;
}
export function deleteDraft(id) {
  write(
    "drafts",
    drafts().filter((x) => x.id !== id),
  );
}
export function duplicateDraft(draft) {
  return saveDraft({ ...draft, id: undefined, name: `${draft.name} (copy)` });
}
