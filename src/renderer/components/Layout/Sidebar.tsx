/** 侧边栏导航 */
import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/auth.store';

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuthStore();

  const currentPath = location.pathname === '/' ? '/dashboard' : location.pathname;

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/videos',
      icon: <VideoCameraOutlined />,
      label: '视频管理',
    },
    {
      key: '/tasks',
      icon: <ClockCircleOutlined />,
      label: '定时任务',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '应用设置',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo 区域 */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--ant-color-border, #f0f0f0)',
        }}
      >
        {collapsed ? (
          <span style={{ fontSize: 22 }}>📺</span>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ant-color-primary, #00A1D6)' }}>
            📺 BiliScheduler
          </span>
        )}
      </div>

      {/* 导航菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[currentPath]}
        items={menuItems}
        disabled={!isLoggedIn}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, flex: 1 }}
      />
    </div>
  );
};
