/** 主布局组件 */
import React, { useState } from 'react';
import { Layout } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './Header';
import { LoginDialog } from '../Login/LoginDialog';
import { LogPanel } from '../Log/LogPanel';
import { useAuthStore } from '../../stores/auth.store';
import { DashboardPage } from '../../pages/DashboardPage';
import { VideosPage } from '../../pages/VideosPage';
import { TasksPage } from '../../pages/TasksPage';
import { SettingsPage } from '../../pages/SettingsPage';

const { Content, Sider } = Layout;

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const { isLoggedIn, isLoading } = useAuthStore();

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        theme="light"
        style={{
          borderRight: '1px solid var(--ant-color-border, #f0f0f0)',
        }}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>

      <Layout>
        {/* 顶部栏 */}
        <HeaderBar
          onToggleLog={() => setLogVisible(!logVisible)}
          logVisible={logVisible}
        />

        {/* 主内容区 */}
        <Content style={{ overflow: 'auto', padding: 24, position: 'relative' }}>
          {/* 未登录显示登录弹窗 */}
          {!isLoggedIn && !isLoading && <LoginDialog visible={true} />}

          {isLoggedIn && (
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/videos" element={<VideosPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </Content>

        {/* 底部日志面板 */}
        {logVisible && <LogPanel onClose={() => setLogVisible(false)} />}
      </Layout>
    </Layout>
  );
};
