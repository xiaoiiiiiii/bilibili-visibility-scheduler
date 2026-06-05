/** 操作日志面板 */
import React, { useEffect, useRef } from 'react';
import { Button, Space, Tag, Typography, Tooltip } from 'antd';
import { CloseOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons';
import { useLogsStore } from '../../stores/logs.store';

const { Text } = Typography;

interface LogPanelProps {
  onClose: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ onClose }) => {
  const { logs, clearLogs } = useLogsStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新日志
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  // 导出日志
  const handleExport = () => {
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
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'success';
      case 'ERROR': return 'error';
      case 'WARN': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div
      style={{
        height: 200,
        borderTop: '1px solid var(--ant-color-border, #f0f0f0)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--ant-color-border, #f0f0f0)',
        }}
      >
        <Space>
          <Text strong style={{ fontSize: 13 }}>📋 操作日志</Text>
          <Tag style={{ fontSize: 11 }}>{logs.length} 条</Tag>
        </Space>
        <Space size="small">
          <Tooltip title="导出日志">
            <Button size="small" type="text" icon={<ExportOutlined />} onClick={handleExport} />
          </Tooltip>
          <Tooltip title="清空日志">
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={clearLogs} />
          </Tooltip>
          <Tooltip title="关闭面板">
            <Button size="small" type="text" icon={<CloseOutlined />} onClick={onClose} />
          </Tooltip>
        </Space>
      </div>

      {/* 日志列表 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 16px',
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: 12,
          lineHeight: 1.8,
        }}
      >
        {logs.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>暂无日志</Text>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {new Date(log.timestamp).toLocaleTimeString('zh-CN')}
              </Text>{' '}
              <Tag
                color={getLevelColor(log.level)}
                style={{ fontSize: 10, lineHeight: '16px', marginRight: 4 }}
              >
                {log.level}
              </Tag>
              <Text style={{ fontSize: 12 }}>{log.message}</Text>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
