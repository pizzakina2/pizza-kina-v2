export function required(value, message = "Pole jest wymagane.") {
  if (!String(value || "").trim()) throw new Error(message);
}
