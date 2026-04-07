import { describe, expect, it } from "vitest";
import { dirnameNormalized, resolveAgainstMdFile } from "@/utils/markdownPreview";

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
});
