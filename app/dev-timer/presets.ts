import type { Stage } from './types';

export interface Preset {
  id: string;
  name: string;
  stages: Stage[];
}

export const PRESETS: Preset[] = [
  {
    id: 'bw-standard',
    name: '黑白胶片标准冲洗',
    stages: [
      { id: 'bw-1', name: '显影', duration: 420 }, // 7分钟
      { id: 'bw-2', name: '定影', duration: 300 }, // 5分钟
      { id: 'bw-3', name: '水洗', duration: 600 }, // 10分钟
    ],
  },
  {
    id: 'c41-standard',
    name: 'C41彩色胶片标准冲洗',
    stages: [
      { id: 'c41-1', name: '显影', duration: 210 }, // 3分30秒
      { id: 'c41-2', name: '漂白', duration: 240 }, // 4分钟
      { id: 'c41-3', name: '定影', duration: 240 }, // 4分钟
      { id: 'c41-4', name: '水洗', duration: 180 }, // 3分钟
    ],
  },
  {
    id: 'e6-standard',
    name: 'E6反转片标准冲洗',
    stages: [
      { id: 'e6-1', name: '一显', duration: 360 }, // 6分钟
      { id: 'e6-2', name: '一停', duration: 120 }, // 2分钟
      { id: 'e6-3', name: '一冲', duration: 360 }, // 6分钟
      { id: 'e6-4', name: '调色', duration: 360 }, // 6分钟
      { id: 'e6-5', name: '漂白', duration: 360 }, // 6分钟
      { id: 'e6-6', name: '定影', duration: 240 }, // 4分钟
      { id: 'e6-7', name: '水洗', duration: 180 }, // 3分钟
    ],
  },
]; 