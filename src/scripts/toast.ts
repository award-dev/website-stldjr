// Tiny toast notifications, announced politely to screen readers.

export function toast(message: string, { tone = "info", timeout = 4200 }: { tone?: "info" | "error"; timeout?: number } = {}) {
  const host = document.querySelector<HTMLElement>("[data-toaster]");
  if (!host) return;
  const el = document.createElement("div");
  el.className = `toast${tone === "error" ? " toast--error" : ""}`;
  el.setAttribute("role", tone === "error" ? "alert" : "status");
  el.textContent = message;
  host.appendChild(el);
  const remove = () => {
    el.setAttribute("data-leaving", "");
    setTimeout(() => el.remove(), 260);
  };
  setTimeout(remove, timeout);
  el.addEventListener("click", remove);
}
