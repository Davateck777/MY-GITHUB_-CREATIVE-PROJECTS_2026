/** Versioned backups are strictly validated before touching browser storage. */
export function makeBackup(links) {
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), drafts: links },
    null,
    2,
  );
}
export function parseBackup(text) {
  if (text.length > 5_000_000)
    throw new Error("Backup exceeds the 5 MB limit.");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This is not valid JSON.");
  }
  if (
    data?.version !== 1 ||
    !Array.isArray(data.drafts) ||
    data.drafts.length > 500
  )
    throw new Error("Expected a version 1 backup with at most 500 drafts.");
  const ids = new Set();
  return data.drafts.map((d) => {
    if (!d || typeof d !== "object") throw new Error("Invalid draft entry.");
    const item = {};
    for (const key of [
      "id",
      "name",
      "headline",
      "about",
      "role",
      "audience",
      "keywords",
      "updatedAt",
    ]) {
      if (typeof d[key] !== "string" || d[key].length > 20000)
        throw new Error(`Invalid draft field: ${key}.`);
      item[key] = d[key];
    }
    if (
      !item.id ||
      ids.has(item.id) ||
      !item.name.trim() ||
      Number.isNaN(Date.parse(item.updatedAt))
    )
      throw new Error("Invalid or duplicate draft identity, name, or date.");
    ids.add(item.id);
    return item;
  });
}
export function draftText(d) {
  return `${d.name}\n\nHEADLINE\n${d.headline}\n\nABOUT\n${d.about}\n`;
}
export function download(text, name, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
