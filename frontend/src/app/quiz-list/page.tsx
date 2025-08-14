'use client';

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '問題集一覧 | AI-Mon',
}

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
  quizSessionId?: string; // 結果画面への遷移用にセッションIDを追加
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
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false); // State for isAdmin flag
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
        return;
      }

      try {
        const userData = await window.apiClient.get('/Prod/users/get') as { AccountName: string, UserId: string, isAdmin: boolean };
        if (userData && typeof userData.isAdmin === 'boolean') {
          setIsAdminUser(userData.isAdmin);
        } else {
          setIsAdminUser(false);
        }

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

        const scoreHistoryResponse = (await window.apiClient.get(
          `/Prod/scores`
        )) as ScoreHistoryApiResponse;
        const scoreHistoryData = scoreHistoryResponse.scores || [];

        const latestScoresByGroup: { [groupId: string]: ScoreHistory } = {};
        scoreHistoryData.forEach((score) => {
          const currentLatest = latestScoresByGroup[score.GroupId];
          if (!currentLatest || new Date(score.StartedAt) > new Date(currentLatest.StartedAt)) {
            latestScoresByGroup[score.GroupId] = score;
          }
        });

        const latestScoreHistoryList = Object.values(latestScoresByGroup);

        const data = await window.apiClient.get(`/Prod/quiz-groups-list`);
        const apiResponse = data as ApiResponse;

        if (apiResponse && apiResponse.groups && Array.isArray(apiResponse.groups)) {
          const formattedData = (apiResponse.groups as LambdaQuizGroup[]).map((group) => {
            const latestScore = latestScoreHistoryList.find(
              (score) => score.GroupId === group.GroupId
            );

            let status = 'not-taken';
            let statusText = '未受験';
            let quizSessionId: string | undefined = undefined;

            if (latestScore) {
              quizSessionId = latestScore.QuizSessionId; // セッションIDをセット
              if (latestScore.SubmittedAt) {
                status = 'completed';
                const submittedDate = new Date(latestScore.SubmittedAt);
                const formattedDate = `${submittedDate.getFullYear()}/${(submittedDate.getMonth() + 1).toString().padStart(2, '0')}/${submittedDate.getDate().toString().padStart(2, '0')}`;
                statusText = `最終受験: ${formattedDate}`;
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
              quizSessionId: quizSessionId,
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
  }, [user]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'not-taken':
        return 'not-taken';
      case 'completed':
        return 'completed';
      case 'in-progress':
        return 'in-progress';
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
      case 'completed':
        return 'completed-text';
      case 'in-progress':
        return 'in-progress-text';
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
          <h2>問題集一覧</h2>
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
          <h2>問題集一覧</h2>
          <p>エラー: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-page">
      <Header />

      <div className="container">
        <h2>問題集一覧</h2>
        <ul className="quiz-group-list">
          {quizGroups.map((group) => (
            <li key={group.id} className={`quiz-group-item ${getStatusClass(group.status)}`}>
              <div className="group-info">
                <h3>{group.name}</h3>
                <p>問題数: {group.questionCount}問</p>
              </div>
              <span className={`group-status ${getStatusTextClass(group.status)}`}>
                {group.status === 'completed' && group.quizSessionId ? (
                  <a
                    href={`/quiz-result?quizSessionId=${group.quizSessionId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/quiz-result?quizSessionId=${group.quizSessionId}`);
                    }}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {group.statusText}
                  </a>
                ) : (
                  group.statusText
                )}
              </span>
              <div className="action-buttons">
                <button onClick={() => handleStartTest(group.id)}>テスト開始</button>
                {isAdminUser && (
                  <button className="edit-button" onClick={() => router.push(`/create-quiz?id=${group.id}&name=${encodeURIComponent(group.name)}`)}>編集</button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {isAdminUser && (
          <button className="add-button" onClick={() => router.push('/quiz-group')}>
            新しい問題集を作成
          </button>
        )}
      </div>
      <Script
        src={`/contents/js/apiClient.js`}
        strategy="beforeInteractive"
      />
    </div>
  );

  async function handleStartTest(groupId: string) {
    if (!window.apiClient) {
      setError('APIクライアントが利用できません。');
      return;
    }
    try {
      const response = await window.apiClient.post('/Prod/scores', { groupId }) as { QuizSessionId: string };
      if (response && response.QuizSessionId) {
        router.push(`/quiz-play?quizSessionId=${response.QuizSessionId}`);
      } else {
        setError('テストセッションの開始に失敗しました。');
      }
    } catch (err) {
      console.error('Error starting test session:', err);
      if (err instanceof Error) {
        setError(`エラーが発生しました: ${err.message}`);
      } else {
        setError('不明なエラーが発生しました。');
      }
    }
  }
}

