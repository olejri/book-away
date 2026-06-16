export interface ParsedCard {
  title: string;
  description: string;
  labels: string[];
  members: string[];
}

const LABEL_COLORS: Record<string, string> = {
  red: "#eb5a46",
  orange: "#ff9f1a",
  yellow: "#f2d600",
  green: "#61bd4f",
  blue: "#0079bf",
  purple: "#c377e0",
  pink: "#ff78cb",
  sky: "#00c2e0",
  lime: "#51e898",
  black: "#344563",
};

export const LABEL_COLOR_OPTIONS = Object.entries(LABEL_COLORS).map(
  ([name, hex]) => ({ name, hex }),
);

export function getLabelColor(label: string): string {
  return LABEL_COLORS[label.toLowerCase().replace(/_/g, " ")] ?? "#4f6ef7";
}

export function parseCardText(text: string): ParsedCard {
  const labels = [...text.matchAll(/#([\w]+)/g)].map((m) =>
    (m[1] ?? "").replace(/_/g, " "),
  );
  const members = [...text.matchAll(/@(\w+)/g)].map((m) => m[1] ?? "");
  const title = text
    .replace(/#[\w]+/g, "")
    .replace(/@\w+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { title, labels, members, description: title };
}

/**
 * Convert natural speech patterns into Trello token syntax.
 * e.g. "buy milk hashtag green assign john" → "buy milk #green @john"
 */
export function normalizeVoiceInput(text: string): string {
  return (
    text
      // hashtag / hash / pound / label / tag → #
      .replace(/\b(?:hashtag|hash tag|hash|pound|label|tag)\s+(\w+)/gi, "#$1")
      // at / at sign / mention / assign / member / for → @
      .replace(
        /\b(?:at sign|at|mention|assign|member|for)\s+(\w+)/gi,
        "@$1",
      )
      // "in progress" style labels → underscore
      .replace(/#(\w+)\s+(\w+)/g, "#$1_$2")
      .trim()
  );
}

