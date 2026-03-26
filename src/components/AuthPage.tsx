import { LockOutlined, SettingOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Space, Typography } from "antd";
import { useState } from "react";
import type { AuthPageProps } from "@/types/app";
import { getConnectionAlert } from "@/utils/connectionValidation";

const { Title, Paragraph, Text } = Typography;

export default function AuthPage({ validation, onAuthorized, onGoToSettings }: AuthPageProps): React.JSX.Element {
  const { message } = App.useApp();
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const alert = getConnectionAlert(validation);

  const handleAuthorize = async (): Promise<void> => {
    setConnecting(true);
    try {
      setErrorMessage(null);
      const result = await onAuthorized();
      if (result.validation.status === "connected-with-spaces") {
        message.success("飞书连接校验成功");
      } else if (result.validation.status === "connected-no-spaces") {
        message.info("已连接飞书，但当前暂无可访问知识空间");
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      setErrorMessage(messageText || "连接校验失败，请稍后重试");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="center-page">
      <Card style={{ width: 440, maxWidth: "100%", textAlign: "center" }}>
        <LockOutlined style={{ fontSize: 32, color: "#1677ff", marginBottom: 12 }} />
        <Title level={4}>连接飞书知识库</Title>
        <Paragraph>
          当前不再走模拟登录。点击下方按钮后，应用会使用设置页中保存的飞书应用配置直接获取
          `tenant_access_token` 并检查知识库访问权限。
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
            message="连接校验失败"
            description={errorMessage}
          />
        )}
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" block loading={connecting} onClick={() => void handleAuthorize()}>
            验证连接并进入应用
          </Button>
          <Button block icon={<SettingOutlined />} onClick={onGoToSettings}>
            返回设置
          </Button>
        </Space>
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          如果连接失败，请检查 App ID、App Secret、知识库权限以及应用是否已加入目标知识空间。
        </Text>
      </Card>
    </div>
  );
}
