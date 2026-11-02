/** Tiny, safe copy syntax: newline → <br>, *words* → <em>. No HTML parsing. */
export type CopyPart =
  { type: "text" | "emphasis"; value: string } | { type: "break" };
export function interpolate(
  value: string,
  variables: Record<string, string | number> = {},
) {
  return value.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, key: string) => {
    if (!Object.hasOwn(variables, key))
      throw new Error(
        `Unknown content placeholder {${key}}. Keep documented placeholders unchanged.`,
      );
    return String(variables[key]);
  });
}
export function parseCopy(value: string): CopyPart[] {
  value = value.replace(/\r\n?/g, "\n");
  const parts: CopyPart[] = [];
  const matcher = /\*([^*\n]+)\*|\n/g;
  let start = 0;
  for (const match of value.matchAll(matcher)) {
    if (match.index! > start)
      parts.push({ type: "text", value: value.slice(start, match.index) });
    parts.push(
      match[0] === "\n"
        ? { type: "break" }
        : { type: "emphasis", value: match[1]! },
    );
    start = match.index! + match[0].length;
  }
  if (start < value.length)
    parts.push({ type: "text", value: value.slice(start) });
  return parts;
}
export function plainCopy(value: string) {
  return parseCopy(value)
    .map((part) => (part.type === "break" ? " " : part.value))
    .join("");
}
