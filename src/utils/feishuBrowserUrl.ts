export interface BrowserOpenTarget {
  kind: "document" | "bitable" | "folder";
  documentId?: string;
  nodeToken?: string;
}

export function buildFeishuBrowserUrl(target: BrowserOpenTarget): { url?: string; error?: string } {
  if (target.kind === "folder") {
    return { error: "文件夹不支持在浏览器中打开" };
  }

  if (target.kind === "document") {
    if (!target.documentId) {
      return { error: "无效的文档标识" };
    }
    return { url: `https://feishu.cn/docx/${target.documentId}` };
  }

  if (!target.nodeToken) {
    return { error: "无效的文档标识" };
  }

  return { url: `https://feishu.cn/base/${target.nodeToken}` };
}
