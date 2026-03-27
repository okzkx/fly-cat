import { describe, expect, it } from "vitest";
import { getFriendlyFailureSummary, parsePermissionFailure } from "@/utils/syncFailurePresentation";

describe("sync failure presentation", () => {
  it("extracts required scopes and apply link from permission errors", () => {
    const message =
      "获取文档信息失败(code=99991672): Access denied. One of the following scopes is required: [docx:document, docx:document:readonly].应用尚未开通所需的用户身份权限：[docx:document, docx:document:readonly]，点击链接申请并开通任一权限即可：https://open.feishu.cn/app/cli_a810b75da5f9100b/auth?q=docx:document,docx:document:readonly&op_from=openapi&token_type=user";

    const parsed = parsePermissionFailure(message);

    expect(parsed).toEqual({
      scopes: ["docx:document", "docx:document:readonly"],
      applyUrl:
        "https://open.feishu.cn/app/cli_a810b75da5f9100b/auth?q=docx:document,docx:document:readonly&op_from=openapi&token_type=user"
    });
  });

  it("builds a reader-friendly auth summary for permission failures", () => {
    const message =
      "获取文档信息失败(code=99991672): Access denied. One of the following scopes is required: [docx:document, docx:document:readonly].";

    expect(getFriendlyFailureSummary("auth", message)).toBe(
      "当前飞书应用缺少文档读取权限，无法读取知识库文档详情。请开通所需权限后重新登录授权。"
    );
  });

  it("keeps unrelated errors unchanged", () => {
    expect(getFriendlyFailureSummary("filesystem-write", "磁盘写入失败")).toBe("磁盘写入失败");
  });
});
