import { LockOutlined, SettingOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Space, Typography } from "antd";
import { cancel, onUrl, start } from "@fabianlars/tauri-plugin-oauth";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useRef, useState } from "react";
import BrandMark from "@/components/BrandMark";
import type { AuthPageProps, ConnectionCheckResult } from "@/types/app";
import { getConnectionAlert } from "@/utils/connectionValidation";
import { beginUserAuthorization, completeUserAuthorization, isTauriRuntime } from "@/utils/runtimeClient";

const { Title, Paragraph, Text } = Typography;
const OAUTH_PORTS = Array.from({ length: 11 }, (_, index) => 3000 + index);
const OAUTH_PORT_RANGE_LABEL = `${OAUTH_PORTS[0]}-${OAUTH_PORTS[OAUTH_PORTS.length - 1]}`;

function formatOAuthListenerError(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  const suffix = detail ? ` 原始错误：${detail}` : "";
  return `初始化本地授权回调失败。请确认 localhost ${OAUTH_PORT_RANGE_LABEL} 端口范围内至少有一个端口可用，并且飞书应用已配置对应回调地址后重试。${suffix}`;
}

function getResultMessage(result: ConnectionCheckResult): string {
  switch (result.validation.status) {
    case "connected-with-spaces":
      return "飞书登录成功，已加载当前账号可访问的知识空间";
    case "connected-no-spaces":
      return "飞书登录成功，但当前账号暂无可访问知识空间";
    default:
      return result.validation.message;
  }
}

function getBrowserRedirectUri(): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

export default function AuthPage({ validation, onAuthorized, onGoToSettings }: AuthPageProps): React.JSX.Element {
  const { message } = App.useApp();
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [listenerReady, setListenerReady] = useState(!isTauriRuntime());
  const [redirectUri, setRedirectUri] = useState("");
  const portRef = useRef<number | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const browserCallbackRef = useRef<string | null>(null);
  const alert = getConnectionAlert(validation);

  useEffect(() => {
    if (!isTauriRuntime()) {
      const nextRedirectUri = getBrowserRedirectUri();
      setRedirectUri(nextRedirectUri);
      setListenerReady(true);

      const currentUrl = new URL(window.location.href);
      const callbackKey = currentUrl.search;
      const code = currentUrl.searchParams.get("code");
      const oauthError = currentUrl.searchParams.get("error");
      const oauthErrorDescription = currentUrl.searchParams.get("error_description");

      if (!code && !oauthError) {
        return;
      }
      if (browserCallbackRef.current === callbackKey) {
        return;
      }

      browserCallbackRef.current = callbackKey;

      const clearCallbackParams = (): void => {
        const cleaned = new URL(window.location.href);
        cleaned.searchParams.delete("code");
        cleaned.searchParams.delete("error");
        cleaned.searchParams.delete("error_description");
        cleaned.searchParams.delete("state");
        window.history.replaceState({}, document.title, cleaned.toString());
      };

      void (async () => {
        try {
          if (oauthError) {
            throw new Error(oauthErrorDescription || oauthError);
          }
          if (!code) {
            throw new Error("飞书授权回调中缺少 code，请重试。");
          }

          setConnecting(true);
          setErrorMessage(null);
          const result = await completeUserAuthorization(code, nextRedirectUri);
          onAuthorized(result);
          if (result.validation.usable) {
            message.success(getResultMessage(result));
          } else {
            message.warning(result.validation.message);
          }
        } catch (error) {
          const messageText = error instanceof Error ? error.message : String(error);
          setErrorMessage(messageText || "飞书授权失败，请稍后重试");
          message.error(messageText || "飞书授权失败，请稍后重试");
        } finally {
          clearCallbackParams();
          setConnecting(false);
        }
      })();

      return;
    }

    let disposed = false;

    const initialize = async (): Promise<void> => {
      try {
        const port = await start({
          ports: OAUTH_PORTS,
          response: "OAuth finished. You may close this tab.",
        });
        if (disposed) {
          await cancel(port);
          return;
        }

        portRef.current = port;
        const nextRedirectUri = `http://localhost:${port}/callback`;
        setRedirectUri(nextRedirectUri);
        setListenerReady(true);

        unlistenRef.current = await onUrl(async (url) => {
          try {
            const parsed = new URL(url);
            const code = parsed.searchParams.get("code");
            const oauthError = parsed.searchParams.get("error");
            const oauthErrorDescription = parsed.searchParams.get("error_description");

            if (oauthError) {
              throw new Error(oauthErrorDescription || oauthError);
            }
            if (!code) {
              throw new Error("飞书授权回调中缺少 code，请重试。");
            }

            setConnecting(true);
            setErrorMessage(null);
            const result = await completeUserAuthorization(code, nextRedirectUri);
            onAuthorized(result);
            if (result.validation.usable) {
              message.success(getResultMessage(result));
            } else {
              message.warning(result.validation.message);
            }
          } catch (error) {
            const messageText = error instanceof Error ? error.message : String(error);
            setErrorMessage(messageText || "飞书授权失败，请稍后重试");
            message.error(messageText || "飞书授权失败，请稍后重试");
          } finally {
            setConnecting(false);
          }
        });
      } catch (error) {
        setErrorMessage(formatOAuthListenerError(error));
      }
    };

    void initialize();

    return () => {
      disposed = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
      if (portRef.current !== null) {
        void cancel(portRef.current);
      }
    };
  }, [message, onAuthorized]);

  const handleAuthorize = async (): Promise<void> => {
    setConnecting(true);
    try {
      setErrorMessage(null);
      if (!redirectUri) {
        throw new Error("本地授权回调尚未准备就绪，请稍后再试。");
      }

      if (!isTauriRuntime()) {
        const authorizeUrl = await beginUserAuthorization(redirectUri);
        window.location.assign(authorizeUrl);
        return;
      }

      const authorizeUrl = await beginUserAuthorization(redirectUri);
      await openUrl(authorizeUrl);
      message.info("已打开浏览器，请在飞书授权页完成登录。");
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setErrorMessage(messageText || "授权启动失败，请稍后重试");
      setConnecting(false);
    }
  };

  return (
    <div className="center-page">
      <Card style={{ width: 480, maxWidth: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <BrandMark size={40} />
        </div>
        <Title level={4}>飞猫助手登录飞书知识库</Title>
        <Paragraph>
          这里改为和参考项目一致的用户授权登录。点击下方按钮后，应用会拉起浏览器完成飞书 OAuth，
          成功后再按当前登录用户的权限加载知识空间并进入应用。
        </Paragraph>
        {alert && !errorMessage && (
          <Alert
            type={alert.type}
            showIcon
            style={{ marginBottom: 16, textAlign: "left" }}
            message={alert.title}
            description={alert.description}
          />
        )}
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16, textAlign: "left" }}
            message="飞书授权失败"
            description={errorMessage}
          />
        )}
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Button
            type="primary"
            block
            icon={<LockOutlined />}
            loading={connecting}
            disabled={!listenerReady}
            onClick={() => void handleAuthorize()}
          >
            {validation?.status === "reauthorization-required" || validation?.status === "session-expired"
              ? "重新登录飞书"
              : "登录飞书并进入应用"}
          </Button>
          <Button block icon={<SettingOutlined />} onClick={onGoToSettings}>
            返回设置
          </Button>
        </Space>
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          如果授权失败，请检查 App ID、App Secret、回调地址，以及 localhost {OAUTH_PORT_RANGE_LABEL} 端口范围内是否仍有可用端口。
        </Text>
      </Card>
    </div>
  );
}
