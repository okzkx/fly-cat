import { describe, expect, it } from "vitest";
import { renderMarkdown, toCanonicalDocument } from "@/services/markdown-renderer";

describe("markdown renderer", () => {
  it("renders deterministic markdown", () => {
    const payload = {
      id: "doc-1",
      title: "Title",
      blocks: [
        { type: "heading", text: "Intro", level: 2 },
        { type: "paragraph", text: "Hello" },
        { type: "image", imageUrl: "https://example.com/a.png" }
      ]
    };
    const markdown = renderMarkdown(toCanonicalDocument(payload));
    expect(markdown).toContain("# Title");
    expect(markdown).toContain("## Intro");
    expect(markdown).toContain("Hello");
    expect(markdown).toContain("![](https://example.com/a.png)");
  });
});
