/** 顶部导航栏 */
import React from 'react';
import { Layout, Button, Space, Tag, Tooltip, Dropdown } from 'antd';
import {
  SunOutlined,
  MoonOutlined,
  LogoutOutlined,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/theme.store';
import { useAuthStore } from '../../stores/auth.store';

const { Header } = Layout;

interface HeaderBarProps {
  onToggleLog: () => void;
  logVisible: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onToggleLog, logVisible }) => {
  const { mode, toggleTheme } = useThemeStore();
  const { user, isLoggedIn, logout } = useAuthStore();

  return (
    <Header
      style={{
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        borderBottom: '1px solid var(--ant-color-border, #f0f0f0)',
      }}
    >
      {/* 左侧标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--ant-color-primary, #00A1D6)' }}>
          📺 B站视频可见性定时器
        </span>
      </div>

      {/* 右侧操作 */}
      <Space size="middle">
        {isLoggedIn && user && (
          <Tag icon={<UserOutlined />} color="blue">
            {user.name}
          </Tag>
        )}

        <Tooltip title="操作日志">
          <Button
            type={logVisible ? 'primary' : 'text'}
            icon={<FileTextOutlined />}
            onClick={onToggleLog}
          />
        </Tooltip>

        <Tooltip title={mode === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
          <Button
            type="text"
            icon={mode === 'light' ? <MoonOutlined /> : <SunOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>

        {isLoggedIn && (
          <Tooltip title="退出登录">
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
              }}
            />
          </Tooltip>
        )}
      </Space>
    </Header>
  );
};
