import { describe, expect, it } from "vitest";
import {
  dirnameNormalized,
  getSupportedExternalPreviewUrl,
  resolveAgainstMdFile
} from "@/utils/markdownPreview";

describe("markdownPreview path helpers", () => {
  it("dirnameNormalized handles backslashes", () => {
    expect(dirnameNormalized("F:\\sync\\Space\\doc.md")).toBe("F:/sync/Space");
  });

  it("resolveAgainstMdFile resolves relative images", () => {
    const md = "F:/sync/MySpace/guide.md";
    expect(resolveAgainstMdFile(md, "../_assets/a.png")).toBe("F:/sync/_assets/a.png");
  });

  it("resolveAgainstMdFile leaves http URLs", () => {
    expect(resolveAgainstMdFile("F:/a/b.md", "https://x/y.png")).toBe("https://x/y.png");
  });

  it("accepts supported external preview URLs", () => {
    expect(getSupportedExternalPreviewUrl("https://feishu.cn/docx/abc")).toBe("https://feishu.cn/docx/abc");
    expect(getSupportedExternalPreviewUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
    expect(getSupportedExternalPreviewUrl("//feishu.cn/docx/abc")).toBe("https://feishu.cn/docx/abc");
    expect(getSupportedExternalPreviewUrl("  https://feishu.cn/x  ")).toBe("https://feishu.cn/x");
  });

  it("rejects unsupported or relative preview URLs", () => {
    expect(getSupportedExternalPreviewUrl("../other.md")).toBeNull();
    expect(getSupportedExternalPreviewUrl("javascript:alert(1)")).toBeNull();
    expect(getSupportedExternalPreviewUrl(null)).toBeNull();
  });
});
