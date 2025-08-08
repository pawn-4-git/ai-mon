'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Script from 'next/script';
import { Toaster, toast } from 'react-hot-toast';
import Image from 'next/image';

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

interface AnswerResult {
  QuestionId: string;
  QuestionText: string;
  SelectedChoice: string;
  CorrectChoice: string;
  IsCorrect: boolean;
  Explanation: string;
}

interface QuizResultData {
  GroupId: string;
  GroupName: string;
  TotalCount: number;
  CorrectCount: number;
  Answers: AnswerResult[];
}

interface Resource {
  ResourceId: string;
  GroupId: string;
  URL: string;
  Title: string;
  ImgSrc: string;
  CreatedAt: string;
}

interface ApiResponse {
  results: QuizResultData;
}

interface ResourcesApiResponse {
  resources: Resource[];
}

function QuizResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resultData, setResultData] = useState<QuizResultData | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const quizSessionId = searchParams.get('quizSessionId');

  useEffect(() => {
    if (!quizSessionId) {
      setError("Quiz Session ID is not provided.");
      setLoading(false);
      return;
    }

    const fetchResultData = async () => {
      if (!window.apiClient) {
        setError('API client is not available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await window.apiClient.get(`/Prod/results/${quizSessionId}`) as ApiResponse;
        setResultData(data.results);

        if (data.results.GroupId) {
          try {
            const resourceData = await window.apiClient.get(`/Prod/resources/list/${data.results.GroupId}`) as ResourcesApiResponse;
            setResources(resourceData.resources);
          } catch (resourceErr) {
            console.error('Failed to fetch recommended resources:', resourceErr);
            toast.error('おすすめのリソースの取得に失敗しました。');
          }
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to fetch quiz results: ${errorMessage}`);
        toast.error(`結果の取得に失敗しました: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [quizSessionId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!resultData) {
    return <div>No result data found.</div>;
  }

  const { TotalCount, CorrectCount, Answers } = resultData;
  const percentage = TotalCount > 0 ? Math.round((CorrectCount / TotalCount) * 100) : 0;

  return (
    <div className="quiz-result-page">
      <Toaster position="top-center" />
      <Header />
      <Script src={`/contents/js/apiClient.js`} strategy="beforeInteractive" />

      <div className="container">
        <h2>テスト結果 (グループ: {resultData.GroupName})</h2>
        <div className="result-summary">
          <p>{`あなたの正解率: ${percentage}% (${CorrectCount}/${TotalCount}問)`}</p>
        </div>

        <ul className="quiz-results-list">
          {Answers.map((result, index) => (
            <li key={result.QuestionId} className={`quiz-result-item ${result.IsCorrect ? 'correct' : 'incorrect'}`}>
              <h3>{`問題${index + 1}: ${result.QuestionText}`}</h3>
              <p>あなたの回答: {result.SelectedChoice}</p>
              <p>正解: {result.CorrectChoice}</p>
              <p className={`answer-status ${result.IsCorrect ? 'correct-text' : 'incorrect-text'}`}>
                {result.IsCorrect ? '正解！' : '不正解...'}
              </p>
              <div className="explanation">
                <p>解説: {result.Explanation}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="reference-links">
          <h3>参考書・関連リソース</h3>
          <ul id="reference-books-list">
            {resources.map((book) => (
              <li key={book.ResourceId}>
                <a href={book.URL} target="_blank" rel="noopener noreferrer">
                  <Image src={book.ImgSrc} alt={book.Title} width={150} height={200} />
                  {book.Title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="action-buttons">
          <button onClick={() => router.push('/score-history')}>成績を見る</button>
          <button className="secondary" onClick={() => router.push('/quiz-list')}>
            問題一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizResult />
    </Suspense>
  );
}