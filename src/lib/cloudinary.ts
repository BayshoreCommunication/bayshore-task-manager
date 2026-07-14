export function getAttachmentUrl(
  url: string,
  mimeType?: string | null,
): string {
  if (!url) return url;
  if (mimeType !== "application/pdf") return url; // images serve fine as-is

  // Insert fl_inline transformation so PDF opens in browser instead of downloading
  return url.replace("/raw/upload/", "/image/upload/");
}
