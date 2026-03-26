import { describe, expect, it } from "vitest";
import type { ConnectionValidation } from "@/types/app";
import { getConnectionAlert, getHomePageEmptyState } from "@/utils/connectionValidation";

function validation(overrides: Partial<ConnectionValidation>): ConnectionValidation {
  return {
    status: "connected-with-spaces",
    usable: true,
    message: "ok",
    spacesLoaded: true,
    ...overrides
  };
}

describe("connection validation presentation", () => {
  it("renders actionable permission guidance", () => {
    const alert = getConnectionAlert(
      validation({
        status: "permission-denied",
        usable: false,
        message: "缺少 wiki 读取权限"
      })
    );

    expect(alert).toEqual({
      type: "warning",
      title: "缺少知识库读取权限",
      description: "缺少 wiki 读取权限"
    });
  });

  it("treats connected-no-spaces as trustworthy empty state", () => {
    const emptyState = getHomePageEmptyState(
      validation({
        status: "connected-no-spaces",
        message: "当前没有可访问知识空间"
      }),
      0
    );

    expect(emptyState).toEqual({
      title: "暂无可同步的知识空间",
      description: "当前没有可访问知识空间"
    });
  });

  it("does not render empty state after failed discovery", () => {
    const emptyState = getHomePageEmptyState(
      validation({
        status: "request-failed",
        usable: false,
        spacesLoaded: false,
        message: "知识空间加载失败"
      }),
      0
    );

    expect(emptyState).toBeNull();
  });
});
