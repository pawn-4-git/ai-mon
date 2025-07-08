'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function QuizGroupPage() {
  const [formData, setFormData] = useState({
    selectedGroup: '',
    newGroupName: '',
    questionCount: '',
    timeLimit: ''
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    if (!formData.questionCount || !formData.timeLimit) {
      alert('問題数と時間設定を入力してください。');
      return;
    }

    if (!formData.selectedGroup && !formData.newGroupName) {
      alert('既存グループを選択するか、新しいグループ名を入力してください。');
      return;
    }

    alert('グループ設定を保存しました！');
    router.push('/create-quiz');
  };

  const handleBack = () => {
    router.push('/create-quiz');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container max-w-2xl">
        <Card title="問題グループ設定">
          <div className="space-y-6">
            <div className="form-group">
              <label htmlFor="selectedGroup">問題グループ:</label>
              <select
                id="selectedGroup"
                name="selectedGroup"
                value={formData.selectedGroup}
                onChange={handleInputChange}
              >
                <option value="">-- 既存グループを選択 または 新規作成 --</option>
                <option value="math">数学</option>
                <option value="history">歴史</option>
                <option value="science">科学</option>
              </select>
              
              <input
                type="text"
                id="newGroupName"
                name="newGroupName"
                value={formData.newGroupName}
                onChange={handleInputChange}
                placeholder="新しいグループ名（任意）"
                className="mt-2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="questionCount">問題数:</label>
              <input
                type="number"
                id="questionCount"
                name="questionCount"
                value={formData.questionCount}
                onChange={handleInputChange}
                placeholder="例: 10"
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="timeLimit">時間設定 (分):</label>
              <input
                type="number"
                id="timeLimit"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleInputChange}
                placeholder="例: 15"
                min="1"
              />
            </div>

            <div className="flex space-x-4">
              <Button onClick={handleSave} variant="primary">
                保存
              </Button>
              <Button onClick={handleBack} variant="secondary">
                戻る
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
