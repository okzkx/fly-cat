/** Parent directory of a file path (slashes normalized to `/`). */
export function dirnameNormalized(filePath: string): string {
  const n = filePath.replace(/\\/g, "/");
  const i = n.lastIndexOf("/");
  if (i <= 0) {
    return n;
  }
  return n.slice(0, i);
}

/**
 * Resolve a markdown image `src` against the `.md` file path (handles `..` and `.`).
 */
export function resolveAgainstMdFile(mdFilePath: string, src: string): string {
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) {
    return src;
  }
  const normalizedSrc = src.replace(/\\/g, "/");
  if (normalizedSrc.startsWith("/") || /^[a-zA-Z]:\//.test(normalizedSrc)) {
    return normalizedSrc;
  }
  const mdDir = dirnameNormalized(mdFilePath);
  const baseSegs = mdDir.split("/").filter((s) => s.length > 0);
  for (const part of normalizedSrc.split("/")) {
    if (part === "" || part === ".") {
      continue;
    }
    if (part === "..") {
      baseSegs.pop();
    } else {
      baseSegs.push(part);
    }
  }
  return baseSegs.join("/");
}

/**
 * Rewrite relative `img[src]` in preview HTML to Tauri `convertFileSrc` URLs.
 */
export function rewritePreviewImagesForTauri(
  html: string,
  mdOutputPath: string,
  convertFileSrc: (filePath: string) => string
): string {
  const wrapped = `<div data-md-preview-root="1">${html}</div>`;
  const doc = new DOMParser().parseFromString(wrapped, "text/html");
  const root = doc.querySelector("[data-md-preview-root]");
  if (!root) {
    return html;
  }
  for (const img of root.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (!src || /^https?:\/\//i.test(src) || src.startsWith("data:")) {
      continue;
    }
    const absolutePosix = resolveAgainstMdFile(mdOutputPath, src);
    const osPath = absolutePosix.replace(/\//g, "\\");
    try {
      const forTauri = /^[a-zA-Z]:\\/.test(osPath) ? osPath : absolutePosix;
      img.setAttribute("src", convertFileSrc(forTauri));
    } catch {
      // keep original src
    }
  }
  return root.innerHTML;
}

const SUPPORTED_EXTERNAL_PREVIEW_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * When markdown uses a host without a scheme (e.g. `feishu.cn/x`), `new URL(href)` fails.
 * Try https only for strings that do not look like relative file paths.
 */
function tryHttpsSchemelessExternal(trimmed: string): URL | null {
  if (/^[./#?\\]/.test(trimmed) || /\s/.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(`https://${trimmed}`);
    const host = parsed.hostname;
    if (!(host.includes(".") || host === "localhost")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Normalize a preview link href into a supported external URL.
 * Relative links intentionally return null so the app does not navigate itself.
 */
export function getSupportedExternalPreviewUrl(href: string | null): string | null {
  if (!href) {
    return null;
  }

  const trimmed = href.trim();
  if (!trimmed) {
    return null;
  }

  // Protocol-relative URLs (//host/path) cannot be parsed by `new URL()` without a base;
  // treat them as https so valid external links still open in the system browser.
  const toParse = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  let parsed: URL;
  try {
    parsed = new URL(toParse);
  } catch {
    const fallback = tryHttpsSchemelessExternal(trimmed);
    if (!fallback) {
      return null;
    }
    parsed = fallback;
  }

  if (!SUPPORTED_EXTERNAL_PREVIEW_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }
  return parsed.toString();
}
