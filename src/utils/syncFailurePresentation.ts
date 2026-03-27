export interface ParsedPermissionFailure {
  scopes: string[];
  applyUrl: string | null;
}

export function parsePermissionFailure(message: string): ParsedPermissionFailure | null {
  if (!message.includes("Access denied") || !message.includes("docx:document")) {
    return null;
  }

  const scopeMatch =
    message.match(/required:\s*\[([^\]]+)\]/i) ??
    message.match(/用户身份权限：\[(.+?)\]/);
  const scopes = scopeMatch
    ? scopeMatch[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const urlMatch = message.match(/https:\/\/open\.feishu\.cn\/\S+/);
  return {
    scopes,
    applyUrl: urlMatch?.[0] ?? null
  };
}

export function getFriendlyFailureSummary(category: string, message: string): string {
  const permissionFailure = parsePermissionFailure(message);
  if (category === "auth" && permissionFailure) {
    return "当前飞书应用缺少文档读取权限，无法读取知识库文档详情。请开通所需权限后重新登录授权。";
  }

  return message;
}
