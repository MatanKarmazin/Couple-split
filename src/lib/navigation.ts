export function safeAppReturnTo(value: string | null | undefined, fallback = "/app/expenses", currentPath?: string) {
  if (!value || !value.startsWith("/app") || value.startsWith("//")) return fallback;
  if (currentPath && stripQuery(value) === stripQuery(currentPath)) return fallback;
  return value;
}

export function withReturnTo(path: string, returnTo: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

function stripQuery(path: string) {
  return path.split("?")[0];
}
