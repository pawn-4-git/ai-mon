'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function QuizGroupPage() {
  const router = useRouter();

  const handleSave = () => {
    alert('グループ設定を保存します');
    // Here you would typically handle the form submission
  };

  const handleBack = () => {
    router.push('/create-quiz');
  };

  return (
    <div className="quiz-group-page">
      <div className="container">
        <h2>問題グループ設定</h2>
        <div className="form-group">
          <label htmlFor="quiz-group">問題グループ:</label>
          <select id="quiz-group">
            <option value="">-- 既存グループを選択 または 新規作成 --</option>
            <option value="math">数学</option>
            <option value="history">歴史</option>
            <option value="science">科学</option>
          </select>
          <input type="text" id="new-group" placeholder="新しいグループ名（任意）" style={{ marginTop: '10px' }} />
        </div>
        <div className="form-group">
          <label htmlFor="number-of-questions">問題数:</label>
          <input type="number" id="number-of-questions" placeholder="例: 10" min="1" />
        </div>

        <div className="form-group">
          <label htmlFor="time-limit">時間設定 (分):</label>
          <input type="number" id="time-limit" placeholder="例: 15" min="1" />
        </div>
        <div className="button-group">
          <button onClick={handleSave}>保存</button>
          <button onClick={handleBack}>戻る</button>
        </div>
      </div>
    </div>
  );
}