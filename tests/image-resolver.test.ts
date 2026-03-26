import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ImageResolver } from "@/services/image-resolver";

describe("image resolver", () => {
  it("keeps remote url when valid", async () => {
    const syncRoot = await mkdtemp(join(tmpdir(), "img-"));
    const resolver = new ImageResolver({
      syncRoot,
      imageDirName: "_assets",
      shouldUseRemote: async () => true,
      downloadImage: async () => Buffer.from("unused")
    });
    const markdown = await resolver.resolve("![](https://example.com/a.png)", join(syncRoot, "a.md"));
    expect(markdown).toBe("![](https://example.com/a.png)");
  });

  it("downloads fallback image when remote invalid", async () => {
    const syncRoot = await mkdtemp(join(tmpdir(), "img-"));
    const resolver = new ImageResolver({
      syncRoot,
      imageDirName: "_assets",
      shouldUseRemote: async () => false,
      downloadImage: async () => Buffer.from("blob")
    });
    const markdown = await resolver.resolve("![](https://example.com/a.png)", join(syncRoot, "docs", "a.md"));
    expect(markdown).toContain("_assets/");
    const relativePath = markdown.slice(4, -1);
    const filePath = join(syncRoot, "docs", relativePath);
    const content = await readFile(filePath);
    expect(content.toString()).toBe("blob");
  });
});
