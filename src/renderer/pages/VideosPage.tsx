/** 视频管理页面 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Checkbox,
  Modal,
  Progress,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';
import { useVideosStore } from '../stores/videos.store';
import type { VideoInfo } from '../../shared/types';

const { Option } = Select;

export const VideosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    videos,
    isLoading,
    selectedBvids,
    fetchVideos,
    toggleSelect,
    selectAll,
    selectNone,
    batchSetPrivacy,
    setPrivacy,
  } = useVideosStore();

  const [searchText, setSearchText] = useState('');
  // 从 URL 参数读取初始筛选状态
  const initialStatus = searchParams.get('status') || 'all';
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [batchProgress, setBatchProgress] = useState<{ visible: boolean; current: number; total: number }>({
    visible: false,
    current: 0,
    total: 0,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  // 筛选视频
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchSearch =
        !searchText ||
        v.title.toLowerCase().includes(searchText.toLowerCase()) ||
        v.bvid.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'private' && v.is_only_self === 1) ||
        (statusFilter === 'public' && v.is_only_self === 0);
      return matchSearch && matchStatus;
    });
  }, [videos, searchText, statusFilter]);

  // 批量操作
  const handleBatchSetPrivacy = async (isPrivate: boolean) => {
    if (selectedBvids.length === 0) {
      message.warning('请先选择视频');
      return;
    }

    const actionText = isPrivate ? '设为私有' : '设为公开';

    Modal.confirm({
      title: `确认${actionText}`,
      content: `即将对 ${selectedBvids.length} 个视频执行"${actionText}"操作，是否继续？`,
      okText: '确认执行',
      cancelText: '取消',
      onOk: async () => {
        setBatchProgress({ visible: true, current: 0, total: selectedBvids.length });

        let successCount = 0;
        for (let i = 0; i < selectedBvids.length; i++) {
          const ok = await setPrivacy(selectedBvids[i], isPrivate);
          if (ok) successCount++;
          setBatchProgress((prev) => ({ ...prev, current: i + 1 }));
        }

        setBatchProgress({ visible: false, current: 0, total: 0 });
        message.success(
          `${actionText}完成！成功: ${successCount}, 失败: ${selectedBvids.length - successCount}`
        );
        fetchVideos();
      },
    });
  };

  // 表格列定义
  const columns: ColumnsType<VideoInfo> = [
    {
      title: (
        <Checkbox
          checked={selectedBvids.length === filteredVideos.length && filteredVideos.length > 0}
          indeterminate={selectedBvids.length > 0 && selectedBvids.length < filteredVideos.length}
          onChange={(e) => (e.target.checked ? selectAll() : selectNone())}
        />
      ),
      key: 'select',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedBvids.includes(record.bvid)}
          onChange={() => toggleSelect(record.bvid)}
        />
      ),
    },
    {
      title: '封面',
      key: 'cover',
      width: 100,
      render: (_, record) => (
        <img
          src={record.cover}
          alt=""
          style={{
            width: 80,
            height: 50,
            objectFit: 'cover',
            borderRadius: 4,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ),
    },
    {
      title: 'BV号',
      dataIndex: 'bvid',
      key: 'bvid',
      width: 130,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '发布时间',
      dataIndex: 'created',
      key: 'created',
      width: 150,
      sorter: (a, b) => a.created - b.created,
      render: (created: number) =>
        created ? new Date(created * 1000).toLocaleString('zh-CN') : '未知',
    },
    {
      title: '当前状态',
      dataIndex: 'is_only_self',
      key: 'is_only_self',
      width: 100,
      filters: [
        { text: '公开', value: 0 },
        { text: '私有', value: 1 },
      ],
      onFilter: (value, record) => record.is_only_self === value,
      render: (val: number) =>
        val === 1 ? (
          <Tag color="red">仅自己可见</Tag>
        ) : (
          <Tag color="green">公开</Tag>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="设为公开">
            <Button
              size="small"
              type={record.is_only_self === 0 ? 'default' : 'primary'}
              icon={<UnlockOutlined />}
              disabled={record.is_only_self === 0}
              onClick={() => setPrivacy(record.bvid, false)}
            >
              公开
            </Button>
          </Tooltip>
          <Tooltip title="设为私有">
            <Button
              size="small"
              type={record.is_only_self === 1 ? 'default' : 'primary'}
              danger={record.is_only_self !== 1}
              icon={<LockOutlined />}
              disabled={record.is_only_self === 1}
              onClick={() => setPrivacy(record.bvid, true)}
            >
              私有
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🎬 视频管理</h2>
        <Button icon={<ReloadOutlined />} loading={isLoading} onClick={fetchVideos}>
          刷新列表
        </Button>
      </div>

      {/* 搜索筛选工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索标题或BV号..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setSearchParams(val === 'all' ? {} : { status: val });
              }}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="public">公开</Option>
              <Option value="private">私有</Option>
            </Select>
          </Space>

          <Space>
            <span style={{ color: '#888', fontSize: 13 }}>
              已选 {selectedBvids.length} / {filteredVideos.length} 个
            </span>
            <Button
              icon={<UnlockOutlined />}
              disabled={selectedBvids.length === 0}
              onClick={() => handleBatchSetPrivacy(false)}
            >
              批量公开
            </Button>
            <Button
              icon={<LockOutlined />}
              danger
              disabled={selectedBvids.length === 0}
              onClick={() => handleBatchSetPrivacy(true)}
            >
              批量私有
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 批量操作进度 */}
      {batchProgress.visible && (
        <Card style={{ marginBottom: 16 }}>
          <Progress
            percent={Math.round((batchProgress.current / batchProgress.total) * 100)}
            format={() => `${batchProgress.current} / ${batchProgress.total}`}
          />
        </Card>
      )}

      {/* 视频表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredVideos}
          rowKey="bvid"
          loading={isLoading}
          pagination={{
            pageSize: 30,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个视频`,
            pageSizeOptions: ['20', '30', '50'],
          }}
          scroll={{ x: 960 }}
          locale={{ emptyText: '暂无视频数据' }}
        />
      </Card>
    </div>
  );
};
