/** Safe DOM construction: user content always uses textContent, never HTML. */
export function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}
export function notify(message, error = false) {
  const n = document.getElementById("notice");
  n.textContent = message;
  n.classList.toggle("error", error);
  n.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => (n.hidden = true), 6000);
}
export function attempt(fn) {
  try {
    return fn();
  } catch (e) {
    notify(e.message, true);
    return null;
  }
}
export async function copy(text) {
  if (!text.trim()) {
    notify("Add some text before copying.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    notify("Copied to clipboard.");
  } catch {
    notify(
      "Clipboard access is unavailable. Select and copy the text manually.",
      true,
    );
  }
}
export function dateLabel(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "Unknown date"
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}
