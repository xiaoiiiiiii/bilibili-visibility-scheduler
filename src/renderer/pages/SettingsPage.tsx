/** 应用设置页面 */
import React, { useEffect, useState } from 'react';
import {
  Card,
  Switch,
  Radio,
  Button,
  Divider,
  Typography,
  Space,
  Tag,
  Modal,
  message,
  Descriptions,
} from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  LaptopOutlined,
  ExportOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../stores/theme.store';
import { useAuthStore } from '../stores/auth.store';
import { useLogsStore } from '../stores/logs.store';
import { useVideosStore } from '../stores/videos.store';
import { useTasksStore } from '../stores/tasks.store';
import type { AppSettings } from '../../shared/types';

const { Text, Title } = Typography;

export const SettingsPage: React.FC = () => {
  const { mode, setMode } = useThemeStore();
  const { user, isLoggedIn, logout } = useAuthStore();
  const { logs, clearLogs } = useLogsStore();
  const { videos } = useVideosStore();
  const { tasks } = useTasksStore();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    autoStart: false,
    minimizeToTray: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await window.electronAPI.getSettings();
      setSettings(s);
    } catch { /* ignore */ }
  };

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...partial };
    setSettings(newSettings);
    try {
      await window.electronAPI.setSettings(partial);
    } catch { /* ignore */ }
  };

  // 导出日志
  const handleExportLogs = () => {
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toLocaleString('zh-CN')}] [${l.level}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bili-scheduler-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('日志已导出');
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 22, marginBottom: 24 }}>⚙️ 应用设置</h2>

      {/* 账号信息 */}
      <Card title={<><InfoCircleOutlined /> 账号信息</>} style={{ marginBottom: 16 }}>
        {isLoggedIn && user ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="当前用户">
              <Tag color="blue">{user.name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户UID">
              <Text code>{user.uid}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="视频数量">
              {videos.length} 个
            </Descriptions.Item>
            <Descriptions.Item label="定时任务">
              {tasks.length} 个
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Text type="secondary">未登录</Text>
        )}
        {isLoggedIn && (
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认退出登录？',
                content: '退出后需重新输入Cookie凭证才能登录',
                okText: '确认退出',
                cancelText: '取消',
                onOk: () => logout(),
              });
            }}
            style={{ marginTop: 12 }}
          >
            退出登录
          </Button>
        )}
      </Card>

      {/* 主题设置 */}
      <Card title={<><SunOutlined /> 主题设置</>} style={{ marginBottom: 16 }}>
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          size="large"
        >
          <Radio.Button value="light">
            <SunOutlined /> 浅色模式
          </Radio.Button>
          <Radio.Button value="dark">
            <MoonOutlined /> 深色模式
          </Radio.Button>
        </Radio.Group>
      </Card>

      {/* 应用行为 */}
      <Card title="🔧 应用行为" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>开机自启</Text>
              <br />
              <Text type="secondary">系统启动时自动运行应用</Text>
            </div>
            <Switch
              checked={settings.autoStart}
              onChange={(val) => updateSettings({ autoStart: val })}
            />
          </div>

          <Divider style={{ margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>最小化到托盘</Text>
              <br />
              <Text type="secondary">关闭窗口时最小化到系统托盘而非退出程序</Text>
            </div>
            <Switch
              checked={settings.minimizeToTray}
              onChange={(val) => updateSettings({ minimizeToTray: val })}
            />
          </div>
        </Space>
      </Card>

      {/* 数据管理 */}
      <Card title="📦 数据管理" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>导出操作日志</Text>
              <br />
              <Text type="secondary">将当前所有日志导出为文本文件</Text>
            </div>
            <Button icon={<ExportOutlined />} onClick={handleExportLogs}>
              导出日志
            </Button>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>清空日志</Text>
              <br />
              <Text type="secondary">清除当前所有操作日志记录</Text>
            </div>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => {
                Modal.confirm({
                  title: '确认清空日志？',
                  content: '此操作不可撤销',
                  okText: '确认清空',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: clearLogs,
                });
              }}
            >
              清空日志
            </Button>
          </div>
        </Space>
      </Card>

      {/* 关于 */}
      <Card title="ℹ️ 关于">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="应用名称">B站视频可见性定时器</Descriptions.Item>
          <Descriptions.Item label="版本">1.0.0</Descriptions.Item>
          <Descriptions.Item label="框架">Electron + React + Ant Design</Descriptions.Item>
          <Descriptions.Item label="功能">
            定时/批量管理B站视频的可见性状态
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};
