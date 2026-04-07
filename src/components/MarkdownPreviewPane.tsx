import { convertFileSrc } from "@tauri-apps/api/core";
import { Card, Empty, Spin, Typography } from "antd";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useMemo } from "react";
import { isTauriRuntime } from "@/utils/tauriRuntime";
import { rewritePreviewImagesForTauri } from "@/utils/markdownPreview";

const { Text } = Typography;

export interface MarkdownPreviewPaneProps {
  /** Selected Feishu document title (tree label). */
  displayTitle: string | null;
  loading: boolean;
  error: string | null;
  markdown: string | null;
  mdOutputPath: string | null;
}

function renderMarkdownHtml(markdown: string, mdOutputPath: string | null): string {
  const raw = marked.parse(markdown, { async: false, gfm: true }) as string;
  const safe = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  if (!isTauriRuntime() || !mdOutputPath) {
    return safe;
  }
  return rewritePreviewImagesForTauri(safe, mdOutputPath, convertFileSrc);
}

export default function MarkdownPreviewPane({
  displayTitle,
  loading,
  error,
  markdown,
  mdOutputPath
}: MarkdownPreviewPaneProps): React.JSX.Element {
  const html = useMemo(() => {
    if (!markdown) {
      return "";
    }
    return renderMarkdownHtml(markdown, mdOutputPath);
  }, [markdown, mdOutputPath]);

  const body = (() => {
    if (!isTauriRuntime()) {
      return (
        <Empty
          description={
            <span>
              浏览器模式下无法读取本机同步目录。
              <br />
              请在飞猫助手桌面版中打开本页，即可预览已同步 Markdown。
            </span>
          }
        />
      );
    }
    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spin tip="加载预览…" />
        </div>
      );
    }
    if (error) {
      return <Empty description={error} />;
    }
    if (!markdown) {
      return <Empty description="在左侧选择一篇已同步的飞书文档，即可在此只读预览本地 Markdown。" />;
    }
    return (
      <div
        className="markdown-preview-body"
        style={{
          maxHeight: "min(70vh, 720px)",
          overflow: "auto",
          padding: "8px 4px",
          fontSize: 14,
          lineHeight: 1.6
        }}
        // sanitized + image src rewritten for Tauri
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  })();

  return (
    <Card
      title={
        <span>
          文档预览
          {displayTitle ? <Text type="secondary"> — {displayTitle}</Text> : null}
        </span>
      }
      styles={{ body: { minHeight: 200 } }}
    >
      {body}
    </Card>
  );
}
