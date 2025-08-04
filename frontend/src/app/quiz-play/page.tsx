'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
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

interface QuestionData {
  totalQuestions: number;
  questionText: string;
  choices: string[];
  userChoice: string | null;
  groupName: string;
}

function QuizPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('quizSessionId');
    const qNumber = searchParams.get('questionNumber');

    if (sessionId) {
      setQuizSessionId(sessionId);
    } else {
      setError("Quiz Session ID is not provided.");
      setLoading(false);
      return;
    }

    const questionNum = qNumber ? parseInt(qNumber, 10) : 1;
    setQuestionNumber(questionNum);

  }, [searchParams]);

  useEffect(() => {
    if (!quizSessionId) return;

    const fetchQuestion = async () => {
      if (!window.apiClient) {
        setError('API client is not available.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await window.apiClient.get(`/Prod/results/${quizSessionId}?questionNumber=${questionNumber}`) as QuestionData;
        setQuestionData(data);
        setSelectedChoice(data.userChoice);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch question data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [quizSessionId, questionNumber]);


  const handleSelectChoice = (choice: string) => {
    setSelectedChoice(choice);
    alert('選択しました: ' + choice);
  };

  const handleNextQuestion = () => {
    if (questionData && questionNumber < questionData.totalQuestions) {
      const nextQuestionNumber = questionNumber + 1;
      router.push(`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=${nextQuestionNumber}`);
    } else {
      alert('これが最後の問題です。');
    }
  };

  return (
    <div className="quiz-play-page">
      <Header />
      <Script
        src={`/contents/js/apiClient.js`}
        strategy="beforeInteractive"
      />

      <div className="container">
        <h2>問題出題中 (グループ: {questionData?.groupName || '...'})</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {questionData && !loading && !error && (
          <>
            <div className="question-area">
              <p>
                <strong id="question-number">{`問題${questionNumber}/${questionData.totalQuestions}`}</strong>
                : {questionData.questionText}
              </p>
            </div>
            <p>残り時間: <span id="remaining-time">10:00</span></p>
            <ul className="choices-list">
              {questionData.choices.map((choice, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSelectChoice(choice)}
                    className={selectedChoice === choice ? 'selected' : ''}
                  >
                    {choice}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="action-buttons">
          <button className="check-later" onClick={() => alert('この問題を後で確認します。')}>
            後で確認する
          </button>
          <button onClick={handleNextQuestion}>
            次の問題へ
          </button>
          <button onClick={() => router.push('/answer-status')}>
            解答状況を確認
          </button>
          <button onClick={() => router.push('/quiz-result')}>
            テストを終える
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizPlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizPlay />
    </Suspense>
  );
}