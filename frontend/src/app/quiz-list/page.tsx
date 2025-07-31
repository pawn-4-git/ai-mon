'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
// import { API_BASE_URL } from '@/lib/api_domain'; // API_BASE_URL は使用されていないため削除
import Script from 'next/script'; // Script をインポート

// apiClient の型定義を追加
declare global {
  interface Window {
    apiClient?: {
      request: (endpoint: string, options?: RequestInit) => Promise<unknown>;
      // get メソッドの戻り値を Promise<unknown> に変更
      get: (endpoint: string, options?: RequestInit) => Promise<unknown>;
      post: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
      put: (endpoint: string, body: unknown, options?: RequestInit) => Promise<unknown>;
      del: (endpoint: string, options?: RequestInit) => Promise<unknown>;
    };
  }
}

// フロントエンドで期待するデータ構造
interface QuizGroup {
  id: string;
  name: string;
  questionCount: number;
  status: string;
  statusText: string;
  timeLimitMinutes?: number; // TimeLimitMinutes を追加
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
  groups?: LambdaQuizGroup[]; // LambdaQuizGroup の配列を期待
}

export default function QuizListPage() {
  const router = useRouter();
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      // apiClient が利用可能かチェックしてから処理を開始します
      if (window.apiClient) {
        try {
          // ScoreHistory データを取得するロジックを追加
          // APIから取得するデータ構造を定義
          interface ScoreHistory {
            QuizSessionId: string;
            UserId: string;
            GroupId: string;
            Score: number;
            SubmittedAt: string;
            StartedAt: string;
          }

          // APIレスポンス全体の型定義（ScoreHistoryの配列を期待）
          interface ScoreHistoryApiResponse {
            message?: string;
            scores?: ScoreHistory[]; // README.md の ScoresTable に基づく
          }

          const scoreHistoryResponse = (await window.apiClient.get(
            '/Prod/score-history'
          )) as ScoreHistoryApiResponse;
          const scoreHistoryData = scoreHistoryResponse.scores || [];

          console.log('Raw Score History Data:', scoreHistoryData);

          // 問題グループごとに最新のデータのみを抽出
          const latestScoresByGroup: { [groupId: string]: ScoreHistory } = {};

          scoreHistoryData.forEach((score) => {
            const currentLatest = latestScoresByGroup[score.GroupId];
            // StartedAt が文字列なので Date オブジェクトに変換して比較
            if (
              !currentLatest ||
              new Date(score.StartedAt) > new Date(currentLatest.StartedAt)
            ) {
              latestScoresByGroup[score.GroupId] = score;
            }
          });

          const latestScoreHistoryList = Object.values(latestScoresByGroup);
          console.log('Latest Score History List:', latestScoreHistoryList);

          // この latestScoreHistoryList を state に保存したり、UIに表示したりでき���す。
          // 例: setLatestScores(latestScoreHistoryList);
          // setQuizGroups の前に、このデータを quizGroups にマージするか、
          // 別途 state で管理するかを検討する必要があります。
          // ここでは、例としてコンソールに出力するだけに留めます。

          // 元の quizGroups を取得するロジック
          const data = await window.apiClient.get(`/Prod/quiz-groups`);

          console.log(data);

          // apiResponse を ApiResponse 型として型アサーション
          const apiResponse = data as ApiResponse;

          // apiResponse.groups が存在し、配列であることをチェック
          if (
            apiResponse &&
            apiResponse.groups &&
            Array.isArray(apiResponse.groups)
          ) {
            // Lambda から返されたデータをフロントエンドの QuizGroup 型に変換
            const formattedData = (
              apiResponse.groups as LambdaQuizGroup[]
            ).map((group) => {
              // 各グループに対応する最新のスコア履歴を検索
              const latestScore = latestScoreHistoryList.find(
                (score) => score.GroupId === group.GroupId
              );

              let status = 'not-taken';
              let statusText = '未受験';

              if (latestScore) {
                // ExpiresAt がないため、StartedAt と SubmittedAt のみで判断
                // SubmittedAt が存在する場合、完了とみなす
                if (latestScore.SubmittedAt) {
                  status = 'completed';
                  statusText = '完了';
                } else if (latestScore.StartedAt) {
                  // StartedAt は存在するが SubmittedAt がない場合、進行中とみなす
                  status = 'in-progress';
                  statusText = '進行中';
                }
              }

              return {
                id: group.GroupId,
                name: group.Name,
                questionCount: group.QuestionCount,
                timeLimitMinutes: group.TimeLimitMinutes, // TimeLimitMinutes をマッピング
                status: status,
                statusText: statusText,
              };
            });
            setQuizGroups(formattedData);
          } else {
            // data が期待通りでない場合の処理
            setError('APIから予期しない形式のデータが返されました。');
            console.error('Unexpected data format:', data);
          }
        } catch (err) {
          console.error('Error fetching quiz groups:', err);
          // エラーメッセージをより具体的に表示
          if (err instanceof Error) {
            setError(`クイズグループの取得に失敗しました: ${err.message}`);
          } else {
            setError('クイズグループの取得中に不明なエラーが発生しました。');
          }
        } finally {
          setLoading(false);
        }
      } else {
        // apiClient がない場合の処理
        setError(
          'APIクライアントが利用できません。ページを再読み込みしてください。'
        );
        setLoading(false);
      }
    };

    fetchQuizData();
  }, []);

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