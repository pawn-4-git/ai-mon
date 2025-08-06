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
  CorrectAnswer: string;
  IsCorrect: boolean;
  Explanation: string;
}

interface QuizResultData {
  GroupName: string;
  TotalCount: number;
  CorrectCount: number;
  Answers: AnswerResult[];
  RecommendedResources?: {
    Title: string;
    URL: string;
    ImageURL: string;
  }[];
}

interface ApiResponse {
  results: QuizResultData;
}

const allReferenceBooks = [
    { imgSrc: "https://via.placeholder.com/150x200?text=Math+Book+1", title: "数学の基礎 - 完全攻略", link: "https://example.com/math-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=History+Book+1", title: "日本史重要ポイント解説", link: "https://example.com/history-guide-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Science+Book+1", title: "科学の不思議 - 図解百科", link: "https://example.com/science-encyclopedia-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=English+Book+1", title: "英語文法マスター", link: "https://example.com/english-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Physics+Book+1", title: "物理学入門", link: "https://example.com/physics-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Chemistry+Book+1", title: "化学の基本", link: "https://example.com/chemistry-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Geography+Book+1", title: "世界地理の旅", link: "https://example.com/geography-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Art+Book+1", title: "美術史概論", link: "https://example.com/art-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Economics+Book+1", title: "経済学のABC", link: "https://example.com/economics-book-1" },
    { imgSrc: "https://via.placeholder.com/150x200?text=Programming+Book+1", title: "プログラミング基礎", link: "https://example.com/programming-book-1" }
];

const getRandomBooks = (arr: { imgSrc: string; title: string; link: string }[], num: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
};


function QuizResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resultData, setResultData] = useState<QuizResultData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedBooks, setRecommendedBooks] = useState<{ imgSrc: string; title: string; link: string }[]>([]);

  const quizSessionId = searchParams.get('quizSessionId');

  useEffect(() => {
    setRecommendedBooks(getRandomBooks(allReferenceBooks, 3));

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
              <p>正解: {result.CorrectAnswer}</p>
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
                {recommendedBooks.map((book, index) => (
                    <li key={index}>
                        <a href={book.link} target="_blank" rel="noopener noreferrer">
                            <Image src={book.imgSrc} alt={book.title} width={150} height={200} />
                            {book.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>

        <div className="action-buttons">
          <button onClick={() => router.push('/score-history')}>成績を記録する</button>
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