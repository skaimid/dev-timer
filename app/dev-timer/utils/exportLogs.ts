import type { Stage, TimerLog } from '../types';
import type { Preset } from '../presets';

interface ExportLogsParams {
  currentPresetId: string;
  allPresets: Preset[];
  stages: Stage[];
  logs: TimerLog[];
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const exportLogs = ({
  currentPresetId,
  allPresets,
  stages,
  logs,
}: ExportLogsParams) => {
  const currentPreset = allPresets.find(p => p.id === currentPresetId);
  const presetInfo = [
    '当前预设配置信息',
    `配置名称: ${currentPreset?.name}`,
    '阶段列表:',
    ...stages.map((stage, index) => 
      `  ${index + 1}. ${stage.name} (${Math.floor(stage.duration / 60)}分${stage.duration % 60}秒)`
    ),
    '\n操作记录列表\n'
  ].join('\n');

  const logsContent = logs.map(log => {
    const startTime = formatDateTime(log.startTime);
    const endTime = log.endTime ? formatDateTime(log.endTime) : '进行中';
    const status = log.status === 'completed' ? '完成' : '取消';
    return `阶段：${log.stageName}\n开始时间：${startTime}\n结束时间：${endTime}\n状态：${status}\n-------------------`;
  }).join('\n\n');

  const content = presetInfo + logsContent;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/[/:]/g, '');
  
  link.href = url;
  link.download = `胶卷冲洗记录_${now}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 