// Input sanitization for Koalafied form fields
// Applied before content reaches Claude. Decisions: strip HTML, 15k char cap per field.

const FIELD_CHAR_LIMIT = 15_000;

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizeField(input: unknown): string {
  if (typeof input !== "string") return "";
  return stripHtml(input).slice(0, FIELD_CHAR_LIMIT).trim();
}

export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().toLowerCase().slice(0, 254);
}
