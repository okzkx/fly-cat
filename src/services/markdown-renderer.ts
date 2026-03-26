import { SyncError } from "@/core/errors";
import type { FeishuDocPayload } from "@/services/mcp-client";

export interface CanonicalBlock {
  kind: "heading" | "paragraph" | "image";
  text?: string;
  level?: number;
  imageUrl?: string;
}

export interface CanonicalDocument {
  id: string;
  title: string;
  blocks: CanonicalBlock[];
}

export function toCanonicalDocument(payload: FeishuDocPayload): CanonicalDocument {
  if (!payload.id || !Array.isArray(payload.blocks)) {
    throw new SyncError("transform", "Invalid payload for canonical transformation");
  }

  const blocks: CanonicalBlock[] = payload.blocks.map((block) => {
    if (block.type === "heading") {
      return { kind: "heading", text: block.text ?? "", level: block.level ?? 1 };
    }
    if (block.type === "image") {
      return { kind: "image", imageUrl: block.imageUrl ?? "" };
    }
    return { kind: "paragraph", text: block.text ?? "" };
  });

  return { id: payload.id, title: payload.title, blocks };
}

export function renderMarkdown(document: CanonicalDocument): string {
  const lines: string[] = [`# ${document.title}`, ""];
  for (const block of document.blocks) {
    if (block.kind === "heading") {
      const level = Math.min(6, Math.max(1, block.level ?? 1));
      lines.push(`${"#".repeat(level)} ${block.text ?? ""}`, "");
      continue;
    }
    if (block.kind === "image") {
      lines.push(`![](${block.imageUrl ?? ""})`, "");
      continue;
    }
    lines.push(block.text ?? "", "");
  }
  return `${lines.join("\n").trim()}\n`;
}
