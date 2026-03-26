import { InfoCircleOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";
import { App, Button, Card, Collapse, Form, Input, Space, Typography } from "antd";
import { useEffect } from "react";
import type { AppSettings, SettingsPageProps } from "@/types/app";

const { Title, Paragraph, Text } = Typography;

const DEFAULT_SETTINGS: AppSettings = {
  appId: "",
  appSecret: "",
  endpoint: "https://open.feishu.cn/open-apis",
  syncRoot: "./synced-docs",
  mcpServerName: "user-feishu-mcp",
  imageDirName: "_assets"
};

export default function SettingsPage({ initialSettings, onSaved }: SettingsPageProps): React.JSX.Element {
  const { message } = App.useApp();
  const [form] = Form.useForm<AppSettings>();

  useEffect(() => {
    form.setFieldsValue(initialSettings ?? DEFAULT_SETTINGS);
  }, [form, initialSettings]);

  const handleFinish = (values: AppSettings): void => {
    message.success("配置保存成功");
    onSaved(values);
  };

  return (
    <div className="center-page">
      <Card style={{ width: 560, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <SettingOutlined style={{ fontSize: 32, color: "#1677ff", marginBottom: 12 }} />
          <Title level={3}>飞书同步配置</Title>
          <Paragraph type="secondary">
            保持与参考工程一致的配置入口，但将配置内容调整为知识库同步与 MCP 获取 Markdown。
          </Paragraph>
        </div>

        <Collapse
          size="small"
          style={{ marginBottom: 20 }}
          items={[
            {
              key: "guide",
              label: (
                <span>
                  <InfoCircleOutlined style={{ marginRight: 8 }} />
                  配置指南
                </span>
              ),
              children: (
                <Space direction="vertical" size="small">
                  <Text>1. 填写飞书应用的 App ID / App Secret。</Text>
                  <Text>2. MCP 服务名默认使用 `user-feishu-mcp`。</Text>
                  <Text>3. 输出目录为 Markdown 同步根目录，图片回退到固定子目录。</Text>
                  <Text>4. 当前版本只同步飞书知识库文档，不处理云盘导出。</Text>
                </Space>
              )
            }
          ]}
        />

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="App ID" name="appId" rules={[{ required: true, message: "请输入 App ID" }]}>
            <Input placeholder="请输入飞书应用 App ID" />
          </Form.Item>
          <Form.Item label="App Secret" name="appSecret" rules={[{ required: true, message: "请输入 App Secret" }]}>
            <Input.Password placeholder="请输入飞书应用 App Secret" />
          </Form.Item>
          <Form.Item label="OpenAPI Endpoint" name="endpoint" rules={[{ required: true, message: "请输入 Endpoint" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="MCP Server Name" name="mcpServerName" rules={[{ required: true, message: "请输入 MCP 服务名" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Markdown Sync Root" name="syncRoot" rules={[{ required: true, message: "请输入同步目录" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Image Fallback Directory" name="imageDirName" rules={[{ required: true, message: "请输入图片目录名" }]}>
            <Input />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              保存配置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
