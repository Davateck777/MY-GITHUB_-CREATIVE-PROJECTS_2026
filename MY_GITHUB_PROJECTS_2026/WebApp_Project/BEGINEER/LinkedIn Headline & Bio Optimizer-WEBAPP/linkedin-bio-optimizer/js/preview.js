/** Illustrative preview, not a reproduction of LinkedIn’s current layout. */
let expanded = false;
export function renderPreview(draft) {
  document.getElementById("preview-headline").textContent =
    draft.headline || "Your professional headline will appear here.";
  const text =
    draft.about ||
    "Tell your story. Your About section will appear here as you write.";
  document.getElementById("preview-about").textContent = expanded
    ? text
    : Array.from(text).slice(0, 320).join("") +
      (Array.from(text).length > 320 ? "…" : "");
  const toggle = document.getElementById("expand-about");
  toggle.hidden = Array.from(text).length <= 320;
  toggle.textContent = expanded ? "Show less" : "See more";
  toggle.setAttribute("aria-expanded", String(expanded));
}
export function setupPreview(getDraft) {
  document.getElementById("expand-about").onclick = () => {
    expanded = !expanded;
    renderPreview(getDraft());
  };
  for (const b of document.querySelectorAll("[data-device]"))
    b.onclick = () => {
      document
        .getElementById("profile-preview")
        .classList.toggle("mobile", b.dataset.device === "mobile");
      for (const x of document.querySelectorAll("[data-device]"))
        x.setAttribute("aria-pressed", String(x === b));
    };
}
