/** 定时任务页面 */
import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  TimePicker,
  Radio,
  Select,
  Drawer,
  List,
  message,
  Popconfirm,
  Collapse,
  Typography,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTasksStore } from '../stores/tasks.store';
import { useVideosStore } from '../stores/videos.store';
import type { TaskInfo, CreateTaskParams, UpdateTaskParams } from '../../shared/types';

const { Text } = Typography;
const { Panel } = Collapse;

export const TasksPage: React.FC = () => {
  const {
    tasks,
    isLoading,
    schedulerRunning,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    executeNow,
    startScheduler,
    stopScheduler,
    checkSchedulerStatus,
  } = useTasksStore();
  const { videos } = useVideosStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskInfo | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<TaskInfo | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
    checkSchedulerStatus();
  }, []);

  // 打开添加/编辑表单
  const openForm = (task?: TaskInfo) => {
    setEditingTask(task || null);
    setSelectedVideos(task?.videoIds || []);
    if (task) {
      const parts = task.timeStr.split(':');
      form.setFieldsValue({
        time: dayjs(`${parts[0]}:${parts[1]}:${parts[2]}`, 'HH:mm:ss'),
        setPrivate: task.setPrivate,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        setPrivate: true,
      });
    }
    setFormOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const timeStr = values.time.format('HH:mm:ss');
      const isPrivate = values.setPrivate;

      if (selectedVideos.length === 0) {
        message.warning('请选择至少一个视频');
        return;
      }

      const videoTitles = selectedVideos.map(
        (bvid) => videos.find((v) => v.bvid === bvid)?.title || '未知标题'
      );

      if (editingTask) {
        const params: UpdateTaskParams = {
          videoIds: selectedVideos,
          videoTitles,
          setPrivate: isPrivate,
          timeStr,
        };
        await updateTask(editingTask.taskId, params);
      } else {
        const params: CreateTaskParams = {
          videoIds: selectedVideos,
          videoTitles,
          setPrivate: isPrivate,
          timeStr,
        };
        await createTask(params);
      }

      setFormOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      // 表单验证失败
    }
  };

  // 表格列
  const columns: ColumnsType<TaskInfo> = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 100,
      ellipsis: true,
      render: (id: string) => (
        <Text code style={{ fontSize: 12 }}>{id.slice(-12)}</Text>
      ),
    },
    {
      title: '执行时间',
      dataIndex: 'timeStr',
      key: 'timeStr',
      width: 120,
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined />
          <Text strong>{time}</Text>
        </Space>
      ),
    },
    {
      title: '目标状态',
      dataIndex: 'setPrivate',
      key: 'setPrivate',
      width: 100,
      render: (val: boolean) =>
        val ? <Tag color="red">仅自己可见</Tag> : <Tag color="green">公开</Tag>,
    },
    {
      title: '操作视频数',
      key: 'videoCount',
      width: 110,
      render: (_, record) => (
        <Tag color="blue">{record.videoIds.length} 个视频</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) =>
        new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => {
              executeNow(record.taskId);
              message.info('任务已触发执行');
            }}
          >
            立即执行
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openForm(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此任务？"
            onConfirm={async () => {
              await deleteTask(record.taskId);
              fetchTasks();
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 标题 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>⏰ 定时任务</h2>
        <Space>
          <Badge
            status={schedulerRunning ? 'processing' : 'default'}
            text={schedulerRunning ? '调度器运行中' : '调度器已停止'}
          />
          {schedulerRunning ? (
            <Button icon={<PauseCircleOutlined />} danger onClick={stopScheduler}>
              停止调度器
            </Button>
          ) : (
            <Button icon={<PlayCircleOutlined />} type="primary" onClick={startScheduler}>
              启动调度器
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={() => { fetchTasks(); checkSchedulerStatus(); }}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 添加任务面板 */}
      <Collapse style={{ marginBottom: 16 }} ghost>
        <Panel
          header={
            <Space>
              <PlusOutlined />
              <span>添加新任务</span>
            </Space>
          }
          key="add"
        >
          <Card>
            <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Form.Item
                name="time"
                label="执行时间"
                rules={[{ required: true, message: '请选择时间' }]}
              >
                <TimePicker format="HH:mm:ss" showNow={false} />
              </Form.Item>

              <Form.Item
                name="setPrivate"
                label="目标可见性"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio value={true}>仅自己可见</Radio>
                  <Radio value={false}>公开</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="选择视频">
                <Select
                  mode="multiple"
                  placeholder="搜索并选择视频"
                  value={selectedVideos}
                  onChange={setSelectedVideos}
                  style={{ minWidth: 360 }}
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  options={videos.map((v) => ({
                    label: `[${v.bvid}] ${v.title}`,
                    value: v.bvid,
                  }))}
                  maxTagCount={3}
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleSubmit}>
                  添加定时任务
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Panel>
      </Collapse>

      {/* 任务列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="taskId"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          onRow={(record) => ({
            onDoubleClick: () => setDetailDrawer(record),
          })}
          locale={{ emptyText: '暂无定时任务，请在上方添加' }}
        />
      </Card>

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务详情"
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        width={500}
      >
        {detailDrawer && (
          <>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <p><Text strong>任务ID: </Text><Text code>{detailDrawer.taskId}</Text></p>
              <p><Text strong>执行时间: </Text><Tag>{detailDrawer.timeStr}</Tag></p>
              <p>
                <Text strong>目标状态: </Text>
                <Tag color={detailDrawer.setPrivate ? 'red' : 'green'}>
                  {detailDrawer.setPrivate ? '仅自己可见' : '公开'}
                </Tag>
              </p>
              <p><Text strong>创建时间: </Text>{new Date(detailDrawer.createdAt).toLocaleString('zh-CN')}</p>
            </Card>

            <Card size="small" title={`关联视频 (${detailDrawer.videoIds.length} 个)`}>
              <List
                size="small"
                dataSource={detailDrawer.videoIds}
                renderItem={(bvid, index) => (
                  <List.Item>
                    <Space>
                      <Text type="secondary">{index + 1}.</Text>
                      <Text code>{bvid}</Text>
                      <Text>{detailDrawer.videoTitles?.[index] || '未知标题'}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </>
        )}
      </Drawer>

      {/* 编辑任务弹窗 */}
      <Modal
        title={editingTask ? '编辑任务' : '添加任务'}
        open={formOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="time"
            label="执行时间"
            rules={[{ required: true, message: '请选择时间' }]}
          >
            <TimePicker format="HH:mm:ss" style={{ width: '100%' }} showNow={false} />
          </Form.Item>

          <Form.Item
            name="setPrivate"
            label="目标可见性"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value={true}>仅自己可见</Radio>
              <Radio value={false}>公开</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="选择视频">
            <Select
              mode="multiple"
              placeholder="搜索并选择要操作的视频"
              value={selectedVideos}
              onChange={setSelectedVideos}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={videos.map((v) => ({
                label: `[${v.bvid}] ${v.title}`,
                value: v.bvid,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
