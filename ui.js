export function qs(selector) {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Brak elementu: ${selector}`);
  return node;
}

export function setNotice(node, message, type = "") {
  node.className = `notice ${type}`.trim();
  node.textContent = message;
}
