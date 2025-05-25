import React, { useState, useEffect } from 'react';
import type { Stage } from './types';

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stage: Omit<Stage, 'id'>) => void;
  initialStage?: Stage;
}

export function StageModal({ isOpen, onClose, onSave, initialStage }: StageModalProps) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  useEffect(() => {
    if (initialStage) {
      setName(initialStage.name);
      setMinutes(Math.floor(initialStage.duration / 60).toString());
      setSeconds((initialStage.duration % 60).toString());
    } else {
      setName('');
      setMinutes('');
      setSeconds('');
    }
  }, [initialStage, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(minutes) * 60 + parseInt(seconds || '0');
    onSave({ name, duration });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">
          {initialStage ? '修改阶段' : '新增阶段'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">阶段名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">时长</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-20 px-3 py-2 border rounded"
                min="0"
                required
              />
              <span>分</span>
              <input
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-20 px-3 py-2 border rounded"
                min="0"
                max="59"
              />
              <span>秒</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 