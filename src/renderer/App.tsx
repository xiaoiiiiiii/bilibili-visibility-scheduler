/** 应用根组件 - 主题配置 + 路由 */
import React, { useEffect } from 'react';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import { HashRouter } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { useThemeStore } from './stores/theme.store';
import { useAuthStore } from './stores/auth.store';
import { useLogsStore } from './stores/logs.store';
import { AppLayout } from './components/Layout/AppLayout';

export const App: React.FC = () => {
  const { mode } = useThemeStore();
  const { checkLogin } = useAuthStore();
  const { initListener } = useLogsStore();

  useEffect(() => {
    // 初始化主题
    useThemeStore.getState().init();
  }, []);

  useEffect(() => {
    // 自动登录检查
    checkLogin();
  }, [checkLogin]);

  useEffect(() => {
    // 初始化日志监听
    const unsubscribe = initListener();
    return () => unsubscribe();
  }, [initListener]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#00A1D6',
          borderRadius: 6,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Microsoft YaHei', '微软雅黑', sans-serif",
        },
      }}
    >
      <AntApp>
        <div className={mode === 'dark' ? 'dark' : ''} style={{ height: '100vh' }}>
          <HashRouter>
            <AppLayout />
          </HashRouter>
        </div>
      </AntApp>
    </ConfigProvider>
  );
};
