import type { ConnectionValidation } from "@/types/app";

export interface ConnectionAlertPresentation {
  type: "success" | "info" | "warning" | "error";
  title: string;
  description: string;
}

export interface HomePageEmptyState {
  title: string;
  description: string;
}

export function getConnectionAlert(validation: ConnectionValidation | null): ConnectionAlertPresentation | null {
  if (!validation) {
    return null;
  }

  switch (validation.status) {
    case "not-signed-in":
      return {
        type: "info",
        title: "需要先登录飞书账号",
        description: validation.message
      };
    case "session-expired":
      return {
        type: "warning",
        title: "登录会话已过期",
        description: validation.message
      };
    case "reauthorization-required":
      return {
        type: "warning",
        title: "需要重新授权",
        description: validation.message
      };
    case "connected-with-spaces":
      return {
        type: "success",
        title: "连接校验成功",
        description: validation.message
      };
    case "connected-no-spaces":
      return {
        type: "info",
        title: "已连接，但暂无可访问知识空间",
        description: validation.message
      };
    case "permission-denied":
      return {
        type: "warning",
        title: "缺少知识库读取权限",
        description: validation.message
      };
    case "request-failed":
      return {
        type: "error",
        title: "知识空间加载失败",
        description: validation.message
      };
    case "unexpected-response":
      return {
        type: "error",
        title: "知识空间响应无法识别",
        description: validation.message
      };
    case "not-configured":
      return {
        type: "warning",
        title: "配置不完整",
        description: validation.message
      };
    default:
      return null;
  }
}

export function getHomePageEmptyState(
  validation: ConnectionValidation | null,
  spaceCount: number
): HomePageEmptyState | null {
  if (spaceCount > 0 || !validation) {
    return null;
  }

  if (validation.status === "connected-no-spaces") {
    return {
      title: "暂无可同步的知识空间",
      description: validation.message
    };
  }

  if (validation.status === "connected-with-spaces" && validation.spacesLoaded) {
    return {
      title: "知识空间列表为空",
      description: "连接已建立，但当前没有可展示的知识空间数据。请重新加载或重新验证连接。"
    };
  }

  return null;
}
