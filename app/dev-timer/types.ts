export interface Stage {
  id: string;
  name: string;
  duration: number; // in seconds
}

export interface TimerLog {
  id: string;
  stageId: string;
  stageName: string;
  startTime: string;
  endTime: string;
  status: 'completed' | 'cancelled';
}

export interface TimerState {
  isRunning: boolean;
  currentStageId: string | null;
  progress: number;
  remainingTime: number;
} 