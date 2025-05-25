import React, { useState, useEffect, useCallback } from "react";
import type { Stage, TimerLog, TimerState } from "./types";
import type { Preset } from "./presets";
import { v4 as uuidv4 } from 'uuid';
import { StageModal } from './StageModal';
import { SavePresetModal } from './SavePresetModal';
import { PRESETS } from './presets';
import { exportLogs } from './utils/exportLogs';

const DEFAULT_PRESET_ID = 'bw-standard';
const STORAGE_KEY = 'dev-timer-custom-presets';

export function DevTimer() {
  const [stages, setStages] = useState<Stage[]>(PRESETS.find(p => p.id === DEFAULT_PRESET_ID)?.stages || []);
  const [currentPresetId, setCurrentPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    currentStageId: null,
    progress: 0,
    remainingTime: 0,
  });
  const [logs, setLogs] = useState<TimerLog[]>([]);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | undefined>();
  const [draggedStage, setDraggedStage] = useState<string | null>(null);
  const [allPresets, setAllPresets] = useState<Preset[]>(PRESETS);

  // 加载自定义预设
  useEffect(() => {
    const customPresets = localStorage.getItem(STORAGE_KEY);
    if (customPresets) {
      try {
        const parsed = JSON.parse(customPresets) as Preset[];
        setAllPresets([...PRESETS, ...parsed]);
      } catch (e) {
        console.error('Failed to load custom presets:', e);
      }
    }
  }, []);

  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    setAudio(audio);
  }, []);

  const handlePresetChange = (presetId: string) => {
    if (timerState.isRunning) {
      alert('请先停止当前计时后再切换预设');
      return;
    }

    const preset = allPresets.find(p => p.id === presetId);
    if (preset) {
      setCurrentPresetId(presetId);
      setStages(preset.stages.map(stage => ({ ...stage, id: uuidv4() })));
    }
  };

  const handleSavePreset = (name: string) => {
    const newPreset: Preset = {
      id: `custom-${uuidv4()}`,
      name,
      stages: stages.map(stage => ({
        ...stage,
        id: `custom-${uuidv4()}`,
      })),
    };

    const customPresets = localStorage.getItem(STORAGE_KEY);
    let updatedPresets: Preset[] = [];

    if (customPresets) {
      try {
        updatedPresets = JSON.parse(customPresets);
      } catch (e) {
        console.error('Failed to parse custom presets:', e);
      }
    }

    updatedPresets.push(newPreset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets));

    setAllPresets([...PRESETS, ...updatedPresets]);
    setCurrentPresetId(newPreset.id);
  };

  const startTimer = useCallback((stage: Stage) => {
    if (timerState.isRunning) return;

    const newLog: TimerLog = {
      id: uuidv4(),
      stageId: stage.id,
      stageName: stage.name,
      startTime: new Date().toISOString(),
      endTime: '',
      status: 'cancelled',
    };

    setTimerState({
      isRunning: true,
      currentStageId: stage.id,
      progress: 0,
      remainingTime: stage.duration,
    });

    setLogs(prev => [...prev, newLog]);
  }, [timerState.isRunning]);

  const stopTimer = useCallback((status: 'completed' | 'cancelled') => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      currentStageId: null,
    }));

    setLogs(prev => prev.map(log => {
      if (log.id === prev[prev.length - 1].id) {
        return {
          ...log,
          endTime: new Date().toISOString(),
          status,
        };
      }
      return log;
    }));

    if (status === 'completed') {
      audio?.play();
    }
  }, [audio]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timerState.isRunning && timerState.remainingTime > 0) {
      timer = setInterval(() => {
        setTimerState(prev => {
          const newRemainingTime = prev.remainingTime - 1;
          const stage = stages.find(s => s.id === prev.currentStageId);
          if (!stage) return prev;

          const progress = ((stage.duration - newRemainingTime) / stage.duration) * 100;

          if (newRemainingTime <= 0) {
            stopTimer('completed');
            return prev;
          }

          return {
            ...prev,
            remainingTime: newRemainingTime,
            progress,
          };
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerState.isRunning, timerState.remainingTime, stages, stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
    setModalOpen(true);
  };

  const handleDelete = (stageId: string) => {
    if (timerState.currentStageId === stageId) {
      stopTimer('cancelled');
    }
    setStages(prev => prev.filter(s => s.id !== stageId));
  };

  const handleSaveStage = (stageData: Omit<Stage, 'id'>) => {
    if (editingStage) {
      setStages(prev => prev.map(s =>
        s.id === editingStage.id ? { ...stageData, id: s.id } : s
      ));
    } else {
      setStages(prev => [...prev, { ...stageData, id: uuidv4() }]);
    }
  };

  const handleDragStart = (stageId: string) => {
    setDraggedStage(stageId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedStage || draggedStage === targetId) return;

    setStages(prev => {
      const draggedIndex = prev.findIndex(s => s.id === draggedStage);
      const targetIndex = prev.findIndex(s => s.id === targetId);
      const newStages = [...prev];
      const [draggedItem] = newStages.splice(draggedIndex, 1);
      newStages.splice(targetIndex, 0, draggedItem);
      return newStages;
    });
  };

  const handleClearLogs = () => {
    if (window.confirm('确定要清除所有操作记录吗？')) {
      setLogs([]);
    }
  };

  const handleExportLogs = () => {
    exportLogs({
      currentPresetId,
      allPresets,
      stages,
      logs,
    });
  };

  const handleClearLocalPresets = () => {
    if (window.confirm('确定要清除所有本地保存的配置吗？\n注意：该操作不可恢复，但不会影响默认配置。')) {
      localStorage.removeItem(STORAGE_KEY);
      setAllPresets(PRESETS);
      if (!PRESETS.some(p => p.id === currentPresetId)) {
        handlePresetChange(DEFAULT_PRESET_ID);
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">胶卷冲洗计时器</h1>
      </div>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-2 w-full">
          <label className="text-sm font-medium whitespace-nowrap">预设配置:</label>
          <select
            value={currentPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="px-2 py-1 border rounded bg-white w-full min-w-[300px] text-sm"
            disabled={timerState.isRunning}
          >
            <optgroup label="默认配置">
              {PRESETS.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </optgroup>
            {allPresets.length > PRESETS.length && (
              <optgroup label="自定义配置">
                {allPresets.slice(PRESETS.length).map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            disabled={timerState.isRunning}
          >
            保存配置
          </button>
          <button
            onClick={handleClearLocalPresets}
            className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            disabled={timerState.isRunning || allPresets.length <= PRESETS.length}
            title={allPresets.length <= PRESETS.length ? '没有本地保存的配置' : ''}
          >
            清除本地配置
          </button>
        </div>
      </div>

      {/* 阶段配置 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">冲洗阶段配置</h2>
          <button
            onClick={() => {
              setEditingStage(undefined);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            新增阶段
          </button>
        </div>
        <div className="grid gap-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              draggable={!timerState.isRunning}
              onDragStart={() => handleDragStart(stage.id)}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              className={`p-4 border rounded-lg transition-colors
                ${timerState.currentStageId === stage.id
                  ? 'bg-blue-100 border-blue-500'
                  : 'hover:bg-gray-50'
                } ${!timerState.isRunning ? 'cursor-move' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span>#{index + 1}</span>
                  <span className="font-medium">{stage.name}</span>
                  <span>{formatTime(stage.duration)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(stage)}
                    disabled={timerState.isRunning}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                  >
                    修改
                  </button>
                  <button
                    onClick={() => handleDelete(stage.id)}
                    disabled={timerState.isRunning}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    删除
                  </button>
                  <button
                    onClick={() => !timerState.isRunning && startTimer(stage)}
                    disabled={timerState.isRunning}
                    className="px-3 py-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                  >
                    开始
                  </button>
                </div>
              </div>

              {timerState.currentStageId === stage.id && (
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${timerState.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 当前计时状态 */}
      {timerState.isRunning && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">当前进行中</h3>
          <div className="flex justify-between items-center">
            <span>
              {stages.find(s => s.id === timerState.currentStageId)?.name}
            </span>
            <span className="text-xl font-mono">
              {formatTime(timerState.remainingTime)}
            </span>
          </div>
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => stopTimer('cancelled')}
          >
            停止
          </button>
        </div>
      )}

      {/* 操作记录 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">操作记录</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导出记录
            </button>
            <button
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              清除记录
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className={`p-3 border rounded ${log.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
                }`}
            >
              <div className="flex justify-between items-center">
                <span>{log.stageName}</span>
                <span className="text-sm text-gray-500">
                  {new Date(log.startTime).toLocaleTimeString()}
                  {log.endTime && ` - ${new Date(log.endTime).toLocaleTimeString()}`}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                状态: {log.status === 'completed' ? '完成' : '取消'}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              暂无操作记录
            </div>
          )}
        </div>
      </div>

      <StageModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingStage(undefined);
        }}
        onSave={handleSaveStage}
        initialStage={editingStage}
      />

      <SavePresetModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSavePreset}
      />
    </div>
  );
}