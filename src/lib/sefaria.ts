// Sefaria API loader for the "לימוד חווייתי" feature.
// Text is always rendered natively inside the app — no external redirects.
// Supports both Talmud Bavli ("Berakhot") and Yerushalmi ("Jerusalem Talmud Berakhot").

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&thinsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const flatten = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  return [];
};

export interface SefariaText {
  ref: string;
  lines: string[];
}

const cache = new Map<string, SefariaText>();

const fetchRef = async (ref: string): Promise<string[]> => {
  const res = await fetch(
    `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`
  );
  if (!res.ok) throw new Error(`Sefaria ${res.status}`);
  const json = await res.json();
  return flatten(json?.he).map(stripHtml).filter(Boolean);
};

export const fetchSefariaAmud = async (
  sefariaName: string,
  daf: string,
  amud: 'a' | 'b'
): Promise<SefariaText> => {
  const ref = `${sefariaName}.${daf}${amud}`;
  const cached = cache.get(ref);
  if (cached) return cached;

  let lines = await fetchRef(ref);
  if (!lines.length) {
    // Yerushalmi pages are sometimes only addressable by chapter:halakhah
    lines = await fetchRef(`${sefariaName}.${daf}`);
  }
  if (!lines.length) throw new Error('empty');
  const result = { ref, lines };
  cache.set(ref, result);
  return result;
};
