export type HashtagToken = {
  value: string;
  normalized: string;
  start: number;
  end: number;
};

const HASHTAG_PATTERN = /#[\p{L}\p{N}_]+/gu;

export function parseHashtags(text: string): HashtagToken[] {
  const tokens: HashtagToken[] = [];
  for (const match of text.matchAll(HASHTAG_PATTERN)) {
    const start = match.index ?? 0;
    const preceding = text[start - 1];
    if (preceding === "/" || (preceding && /[\p{L}\p{N}_]/u.test(preceding))) continue;

    const value = match[0];
    tokens.push({
      value,
      normalized: value.slice(1).toLocaleLowerCase(),
      start,
      end: start + value.length,
    });
  }
  return tokens;
}

export function splitHashtagText(text: string): Array<{ text: string; hashtag?: string }> {
  const tokens = parseHashtags(text);
  if (!tokens.length) return [{ text }];

  const parts: Array<{ text: string; hashtag?: string }> = [];
  let cursor = 0;
  for (const token of tokens) {
    if (token.start > cursor) parts.push({ text: text.slice(cursor, token.start) });
    parts.push({ text: token.value, hashtag: token.value });
    cursor = token.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

export function normalizeHashtagQuery(query: string): string | null {
  const trimmed = query.trim();
  const value = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  return /^\p{L}[\p{L}\p{N}_]*$/u.test(value) ? value.toLocaleLowerCase() : null;
}
