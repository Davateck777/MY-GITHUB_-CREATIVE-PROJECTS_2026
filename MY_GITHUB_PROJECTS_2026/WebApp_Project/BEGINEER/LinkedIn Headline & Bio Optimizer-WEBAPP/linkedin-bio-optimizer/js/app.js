/** Shared theme and navigation shell. */
import { read, write } from "./storage.js";
import { attempt } from "./ui.js";
document.documentElement.dataset.theme = read("theme", "light");
const button = document.getElementById("theme");
function update() {
  button.textContent =
    document.documentElement.dataset.theme === "dark"
      ? "☀ Light mode"
      : "◐ Dark mode";
}
update();
button.addEventListener("click", () => {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  attempt(() => write("theme", next));
  update();
});
