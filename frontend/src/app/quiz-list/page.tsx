'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext'; // useAuth をインポート
import Script from 'next/script';

// apiClient の型定義を追加
declare global {
  interface Window {
    apiClient?: {
      request: (endpoint: string, options?: RequestInit) => Promise<unknown>;
      get: (endpoint: string, options?: RequestInit) => Promise<unknown>;
      post: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
      put: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
      del: (endpoint: string, options?: RequestInit) => Promise<unknown>;
    };
  }
}

interface QuizGroup {
  id: string;
  name: string;
  questionCount: number;
  status: string;
  statusText: string;
  timeLimitMinutes?: number;
}

// Lambda から返されるデータ構造（仮定）
interface LambdaQuizGroup {
  GroupId: string;
  Name: string;
  QuestionCount: number;
  TimeLimitMinutes: number;
  CreatedAt: string;
  CreatedBy: string;
}

// APIレスポンス全体の型定義
interface ApiResponse {
  message?: string;
  groups?: LambdaQuizGroup[];
}

export default function QuizListPage() {
  const router = useRouter();
  const { user } = useAuth(); // AuthContext から user を取得
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!window.apiClient) {
        setError('APIクライアントが利用できません。ページを再読み込みしてください。');
        setLoading(false);
        return;
      }

      if (!user) {
        // ユーザー情報がまだ読み込まれていない場合は待機
        // AuthContextがユーザー情報を取得するのを待つ
        return;
      }

      try {
        // ScoreHistory データを取得するロジック
        interface ScoreHistory {
          QuizSessionId: string;
          UserId: string;
          GroupId: string;
          Score: number;
          SubmittedAt: string;
          StartedAt: string;
        }

        interface ScoreHistoryApiResponse {
          message?: string;
          scores?: ScoreHistory[];
        }

        // 正しいエンドポイントに修正
        const scoreHistoryResponse = (await window.apiClient.get(
          `/Prod/users/${user.id}/score-history`
        )) as ScoreHistoryApiResponse;
        const scoreHistoryData = scoreHistoryResponse.scores || [];

        console.log('Raw Score History Data:', scoreHistoryData);

        const latestScoresByGroup: { [groupId: string]: ScoreHistory } = {};
        scoreHistoryData.forEach((score) => {
          const currentLatest = latestScoresByGroup[score.GroupId];
          if (!currentLatest || new Date(score.StartedAt) > new Date(currentLatest.StartedAt)) {
            latestScoresByGroup[score.GroupId] = score;
          }
        });

        const latestScoreHistoryList = Object.values(latestScoresByGroup);
        console.log('Latest Score History List:', latestScoreHistoryList);

        // quizGroups を取得するロジック
        const data = await window.apiClient.get(`/Prod/quiz-groups`);
        console.log(data);

        const apiResponse = data as ApiResponse;

        if (apiResponse && apiResponse.groups && Array.isArray(apiResponse.groups)) {
          const formattedData = (apiResponse.groups as LambdaQuizGroup[]).map((group) => {
            const latestScore = latestScoreHistoryList.find(
              (score) => score.GroupId === group.GroupId
            );

            let status = 'not-taken';
            let statusText = '未受験';

            if (latestScore) {
              if (latestScore.SubmittedAt) {
                status = 'completed';
                statusText = '完了';
              } else if (latestScore.StartedAt) {
                status = 'in-progress';
                statusText = '進行中';
              }
            }

            return {
              id: group.GroupId,
              name: group.Name,
              questionCount: group.QuestionCount,
              timeLimitMinutes: group.TimeLimitMinutes,
              status: status,
              statusText: statusText,
            };
          });
          setQuizGroups(formattedData);
        } else {
          setError('APIから予期しない形式のデータが返されました。');
          console.error('Unexpected data format:', data);
        }
      } catch (err) {
        console.error('Error fetching quiz groups:', err);
        if (err instanceof Error) {
          setError(`クイズグループの取得に失敗しました: ${err.message}`);
        } else {
          setError('クイズグループの取得中に不明なエラーが発生しました。');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [user]); // useEffect の依存配列に user を追加

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'not-taken':
        return 'not-taken';
      case 'completed': // 'completed' ステータスを追加
        return 'completed';
      case 'in-progress': // 'in-progress' ステータスを追加
        return 'in-progress';
      case 'updated': // 既存の 'updated' ステータス
        return 'updated';
      default:
        return '';
    }
  };

  const getStatusTextClass = (status: string) => {
    switch (status) {
      case 'not-taken':
        return 'not-taken-text';
      case 'completed': // 'completed' ステータスを追加
        return 'completed-text';
      case 'in-progress': // 'in-progress' ステータスを追加
        return 'in-progress-text';
      case 'updated': // 既存の 'updated' ステータス
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
      {/* apiClient.js を Script コンポーネントで読み込む */}
      <Script
        src={`/contents/js/apiClient.js`} // apiClient.js のパスを指定
        strategy="beforeInteractive"
      />
    </div>
  );
}
