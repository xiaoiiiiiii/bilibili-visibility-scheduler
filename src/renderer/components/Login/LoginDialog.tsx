/** 登录弹窗 */
import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert, Space, Typography } from 'antd';
import { KeyOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/auth.store';

const { Text, Paragraph } = Typography;

interface LoginDialogProps {
  visible: boolean;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ visible }) => {
  const [form] = Form.useForm();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showGuide, setShowGuide] = useState(true);

  const handleLogin = async (values: { sessdata: string; biliJct: string; dedeUserId: string }) => {
    const success = await login(values.sessdata.trim(), values.biliJct.trim(), values.dedeUserId.trim());
    if (success) {
      form.resetFields();
    }
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined style={{ color: '#00A1D6' }} />
          <span>登录B站账号</span>
        </Space>
      }
      open={visible}
      closable={false}
      footer={null}
      maskClosable={false}
      width={480}
      centered
    >
      {showGuide && (
        <Alert
          type="info"
          message="如何获取登录凭证？"
          description={
            <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
              1. 使用浏览器登录{' '}
              <a href="https://www.bilibili.com" target="_blank" rel="noreferrer">
                B站
              </a>
              <br />
              2. 按 F12 打开开发者工具 → 应用/Application → Cookies → bilibili.com
              <br />
              3. 分别复制 <Text code>SESSDATA</Text>、<Text code>bili_jct</Text> 和{' '}
              <Text code>DedeUserID</Text> 的值
              <br />
              4. 粘贴到下方对应输入框中
            </Paragraph>
          }
          closable
          onClose={() => setShowGuide(false)}
          style={{ marginBottom: 16 }}
        />
      )}

      {!showGuide && (
        <Button
          type="link"
          size="small"
          onClick={() => setShowGuide(true)}
          style={{ marginBottom: 8, padding: 0 }}
        >
          查看获取凭证教程
        </Button>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleLogin} autoComplete="off">
        <Form.Item
          name="sessdata"
          label="SESSDATA"
          rules={[{ required: true, message: '请输入 SESSDATA' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="从浏览器 Cookie 中复制 SESSDATA 值"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="biliJct"
          label="bili_jct"
          rules={[{ required: true, message: '请输入 bili_jct' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="从浏览器 Cookie 中复制 bili_jct 值"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="dedeUserId"
          label="DedeUserID"
          rules={[{ required: true, message: '请输入 DedeUserID' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="从浏览器 Cookie 中复制 DedeUserID（UID）值"
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            size="large"
            style={{ height: 44 }}
          >
            {isLoading ? '正在登录...' : '登录'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
