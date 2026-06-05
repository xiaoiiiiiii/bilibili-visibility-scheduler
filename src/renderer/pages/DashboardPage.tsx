/** 仪表盘页面 */
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, Space, Tag, List, Typography, Tooltip } from 'antd';
import {
  VideoCameraOutlined,
  LockOutlined,
  UnlockOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useVideosStore } from '../stores/videos.store';
import { useTasksStore } from '../stores/tasks.store';
import { useLogsStore } from '../stores/logs.store';
import type { DashboardStats } from '../../shared/types';

const { Text } = Typography;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { videos, fetchVideos, isLoading: videosLoading } = useVideosStore();
  const { tasks, fetchTasks, schedulerRunning, startScheduler, stopScheduler, checkSchedulerStatus } = useTasksStore();
  const { logs } = useLogsStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    privateVideos: 0,
    publicVideos: 0,
    activeTasks: 0,
  });

  useEffect(() => {
    fetchVideos();
    fetchTasks();
    checkSchedulerStatus();
  }, []);

  useEffect(() => {
    setStats({
      totalVideos: videos.length,
      privateVideos: videos.filter((v) => v.is_only_self === 1).length,
      publicVideos: videos.filter((v) => v.is_only_self === 0).length,
      activeTasks: tasks.length,
    });
  }, [videos, tasks]);

  /** 卡片配置：标题、值、图标、颜色、跳转路径 */
  const statCards = [
    {
      title: '视频总数',
      value: stats.totalVideos,
      icon: <VideoCameraOutlined style={{ color: '#00A1D6' }} />,
      color: undefined,
      tip: '点击查看全部视频',
      onClick: () => navigate('/videos?status=all'),
    },
    {
      title: '公开视频',
      value: stats.publicVideos,
      icon: <UnlockOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
      tip: '点击筛选公开视频',
      onClick: () => navigate('/videos?status=public'),
    },
    {
      title: '私有视频',
      value: stats.privateVideos,
      icon: <LockOutlined style={{ color: '#ff4d4f' }} />,
      color: '#ff4d4f',
      tip: '点击筛选私有视频',
      onClick: () => navigate('/videos?status=private'),
    },
    {
      title: '活跃任务',
      value: stats.activeTasks,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      color: undefined,
      tip: '点击查看定时任务',
      onClick: () => navigate('/tasks'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>📊 仪表盘</h2>
        <Button icon={<ReloadOutlined />} loading={videosLoading} onClick={() => { fetchVideos(); fetchTasks(); }}>
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 - 可点击跳转 */}
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} lg={6}>
            <Tooltip title={card.tip}>
              <Card
                hoverable
                onClick={card.onClick}
                style={{ cursor: 'pointer' }}
              >
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={card.icon}
                  valueStyle={card.color ? { color: card.color } : undefined}
                />
              </Card>
            </Tooltip>
          </Col>
        ))}
      </Row>

      {/* 调度器状态卡片 */}
      <Card
        title="⏱️ 调度器状态"
        style={{ marginTop: 24 }}
        extra={
          <Space>
            <Tag color={schedulerRunning ? 'success' : 'default'}>
              {schedulerRunning ? '运行中' : '已停止'}
            </Tag>
            {schedulerRunning ? (
              <Button size="small" danger icon={<PauseCircleOutlined />} onClick={stopScheduler}>
                停止
              </Button>
            ) : (
              <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={startScheduler}>
                启动
              </Button>
            )}
          </Space>
        }
      >
        <Text type="secondary">
          {schedulerRunning
            ? `调度器正在运行，共管理 ${tasks.length} 个定时任务`
            : '调度器已停止，定时任务不会自动执行。点击"启动"按钮开始调度'}
        </Text>
      </Card>

      {/* 最近日志 */}
      <Card title="📋 最近操作日志" style={{ marginTop: 24 }}>
        <List
          size="small"
          dataSource={logs.slice(-10).reverse()}
          locale={{ emptyText: '暂无日志记录' }}
          renderItem={(item) => (
            <List.Item>
              <Space>
                <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  {new Date(item.timestamp).toLocaleTimeString('zh-CN')}
                </Text>
                <Tag
                  color={
                    item.level === 'SUCCESS' ? 'success' :
                    item.level === 'ERROR' ? 'error' :
                    item.level === 'WARN' ? 'warning' : 'default'
                  }
                  style={{ fontSize: 11 }}
                >
                  {item.level}
                </Tag>
                <Text style={{ fontSize: 13 }}>{item.message}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
