'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Script from 'next/script';
import { Toaster, toast } from 'react-hot-toast';

// apiClient の型定義
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

interface AnswerStatus {
  QuestionId: string;
  QuestionText: string;
  SelectedChoice: string | null;
  AfterCheck: boolean;
}

interface QuizResults {
  GroupName: string;
  Answers: AnswerStatus[];
}

interface ApiResponse {
  results: QuizResults;
}

function AnswerStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const quizSessionId = searchParams.get('quizSessionId');
  const questionNumber = searchParams.get('questionNumber');

  useEffect(() => {
    if (!quizSessionId) {
      setError("Quiz Session ID is not provided.");
      setLoading(false);
      return;
    }

    const fetchAnswerStatus = async () => {
      if (!window.apiClient) {
        setError('API client is not available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await window.apiClient.get(`/Prod/results/${quizSessionId}`) as ApiResponse;
        setResults(data.results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to fetch answer status: ${errorMessage}`);
        toast.error(`解答状況の取得に失敗しました: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswerStatus();
  }, [quizSessionId]);

  const handleBackToQuiz = () => {
    if (quizSessionId && questionNumber) {
      router.push(`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=${questionNumber}`);
    } else if (quizSessionId) {
      // questionNumberがない場合は最初の問題へ
      router.push(`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=1`);
    } else {
      // quizSessionIdもない場合はリストへ
      router.push('/quiz-list');
    }
  };

  const handleFinishTest = async () => {
    if (!quizSessionId || !window.apiClient) {
      setError('Quiz Session ID or API client is not available.');
      return;
    }

    if (!confirm('テストを本当に終了しますか？')) {
      return;
    }

    try {
      await window.apiClient.post(`/Prod/quizzes/completion`, {
        quizId: quizSessionId,
      });
      toast.success('テストが完了しました。');
      router.push(`/quiz-result?quizSessionId=${quizSessionId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`テストの終了に失敗しました: ${errorMessage}`);
      setError(`Failed to finish the test: ${errorMessage}`);
    }
  };

  const getStatusInfo = (item: AnswerStatus) => {
    if (item.AfterCheck) {
      return { className: 'checked-later', text: '後で確認' };
    }
    if (item.SelectedChoice) {
      return { className: 'answered', text: '解答済み' };
    }
    return { className: 'unanswered', text: '未解答' };
  };

  return (
    <div className="answer-status-page">
      <Toaster position="top-center" />
      <Header />
      <Script src={`/contents/js/apiClient.js`} strategy="beforeInteractive" />

      <div className="container">
        <h2>解答状況一覧 (グループ: {results?.GroupName || '...'})</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {results && !loading && !error && (
          <>
            <ul className="status-list">
              {results.Answers.map((item, index) => {
                const status = getStatusInfo(item);
                return (
                  <li key={item.QuestionId} className={`status-item ${status.className}`}>
                    <div className="question-info">
                      <h3>
                        <Link href={`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=${index + 1}`}>
                          {`問題${index + 1}: ${item.QuestionText}`}
                        </Link>
                      </h3>
                      <p>あなたの回答: {item.SelectedChoice || '未解答'}</p>
                    </div>
                    <span className={`status-badge ${status.className}`}>{status.text}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <div className="action-buttons">
          <button className="back-button" onClick={handleBackToQuiz}>
            問題に戻る
          </button>
          <button className="finish-button" onClick={handleFinishTest}>
            テストを終える
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnswerStatusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnswerStatus />
    </Suspense>
  );
}
