import { LockOutlined, SettingOutlined } from "@ant-design/icons";
import { App, Button, Card, Space, Typography } from "antd";
import type { AuthPageProps } from "@/types/app";

const { Title, Paragraph, Text } = Typography;

export default function AuthPage({ onAuthorized, onGoToSettings }: AuthPageProps): React.JSX.Element {
  const { message } = App.useApp();

  const handleAuthorize = async (): Promise<void> => {
    await onAuthorized();
    message.success("授权成功");
  };

  return (
    <div className="center-page">
      <Card style={{ width: 440, maxWidth: "100%", textAlign: "center" }}>
        <LockOutlined style={{ fontSize: 32, color: "#1677ff", marginBottom: 12 }} />
        <Title level={4}>飞书登录授权</Title>
        <Paragraph>
          保留参考工程中的独立授权页和状态说明，当前使用本地模拟授权，后续可替换为真实 Tauri OAuth + MCP 会话。
        </Paragraph>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" block onClick={() => void handleAuthorize()}>
            模拟授权并进入应用
          </Button>
          <Button block icon={<SettingOutlined />} onClick={onGoToSettings}>
            返回设置
          </Button>
        </Space>
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          后续这里将替换为与参考工程一致的扫码 / 浏览器授权双通道。
        </Text>
      </Card>
    </div>
  );
}
