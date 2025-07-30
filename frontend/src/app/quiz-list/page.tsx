'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { API_BASE_URL } from '@/lib/api_domain';

interface ApiQuizGroup {
  id: string;
  name: string;
  questions?: unknown[];
}

interface QuizGroup {
  id: string;
  name: string;
  questionCount: number;
  status: string;
  statusText: string;
}

export default function QuizListPage() {
  const router = useRouter();
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizGroups = async () => {
      try {
        const response = await fetch(`/Prod/quiz-groups`);
        if (!response.ok) {
          throw new Error('問題グループの取得に失敗しました。');
        }
        const data: ApiQuizGroup[] = await response.json();
        // APIから返されるデータにstatusとstatusTextがないため、ダミーのデータを追加します。
        const formattedData = data.map((group) => ({
          ...group,
          questionCount: group.questions ? group.questions.length : 0,
          status: 'not-taken', // 仮のステータス
          statusText: '未受験', // 仮のステータス文言
        }));
        setQuizGroups(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizGroups();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'not-taken':
        return 'not-taken';
      case 'updated':
        return 'updated';
      default:
        return '';
    }
  };

  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'not-taken':
        return 'not-taken-text';
      case 'updated':
        return 'updated-text';
      default:
        return '';
    }
  }

  if (loading) {
    return (
      <div className="quiz-list-page">
        <Header />
        <div className="container">
          <h2>問題グループ一覧</h2>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-list-page">
        <Header />
        <div className="container">
          <h2>問題グループ一覧</h2>
          <p>エラー: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-page">
      <Header />

      <div className="container">
        <h2>問題グループ一覧</h2>
        <ul className="quiz-group-list">
          {quizGroups.map((group) => (
            <li key={group.id} className={`quiz-group-item ${getStatusClass(group.status)}`}>
              <div className="group-info">
                <h3>{group.name}</h3>
                <p>問題数: {group.questionCount}問</p>
              </div>
              <span className={`group-status ${getStatusTextClass(group.status)}`}>{group.statusText}</span>
              <div className="action-buttons">
                <button onClick={() => router.push('/quiz-play')}>テスト開始</button>
                <button className="edit-button" onClick={() => router.push(`/create-quiz?id=${group.id}`)}>編集</button>
              </div>
            </li>
          ))}
        </ul>
        <button className="add-button" onClick={() => router.push('/create-quiz')}>
          新しい問題グループを作成
        </button>
      </div>
    </div>
  );
}