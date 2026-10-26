const $ = (id) => document.getElementById(id);

function status(msg) { $("status").textContent = msg; }

async function run(mode) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  ["long", "a4"].forEach((id) => ($(id).disabled = true));
  status("Preparando la página…");
  chrome.runtime.sendMessage({ type: "save-pdf", tabId: tab.id, mode });
}

$("long").addEventListener("click", () => run("long"));
$("a4").addEventListener("click", () => run("a4"));

// background.js va contando el progreso mientras el popup siga abierto.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "pdf-status") return;
  status(msg.text);
  if (msg.done) ["long", "a4"].forEach((id) => ($(id).disabled = false));
});
