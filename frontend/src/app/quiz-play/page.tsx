'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Script from 'next/script';
import { Toaster, toast } from 'react-hot-toast';

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
  checkedLaterQuestions?: number[];
}

function QuizPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [checkedLaterQuestions, setCheckedLaterQuestions] = useState<number[]>([]);
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
        if (data.checkedLaterQuestions) {
          setCheckedLaterQuestions(data.checkedLaterQuestions);
        }
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


  const handleSelectChoice = async (choice: string) => {
    setSelectedChoice(choice);

    if (!quizSessionId || !window.apiClient) {
      setError('Quiz Session ID or API client is not available.');
      return;
    }

    try {
      await window.apiClient.post(`/Prod/quizzes/${quizSessionId}/answers`, {
        questionNumber: questionNumber,
        userAnswer: choice,
      });
      console.log('Answer submitted successfully!');
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to submit answer: ${err.message}`);
      } else {
        setError('Failed to submit answer.');
      }
    }
  };

  const handleCheckLater = async () => {
    if (!quizSessionId || !window.apiClient) {
      setError('Quiz Session ID or API client is not available.');
      return;
    }

    let updatedLaterQuestions;
    const isAlreadyChecked = checkedLaterQuestions.includes(questionNumber);

    if (isAlreadyChecked) {
      updatedLaterQuestions = checkedLaterQuestions.filter(
        (qNum) => qNum !== questionNumber
      );
    } else {
      updatedLaterQuestions = [...checkedLaterQuestions, questionNumber].sort(
        (a, b) => a - b
      );
    }

    try {
      await window.apiClient.post(`/Prod/userAnswerSelection`, {
        scoreId: quizSessionId,
        questionNumber: questionNumber,
        checkedLaterQuestions: updatedLaterQuestions,
      });
      setCheckedLaterQuestions(updatedLaterQuestions);
      if (isAlreadyChecked) {
        toast.success(`問題${questionNumber}の「後で確認する」を解除しました。`);
      } else {
        toast.success(`問題${questionNumber}を「後で確認する」に設定しました。`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`更新に失敗しました: ${errorMessage}`);
      setError(`Failed to update check later status: ${errorMessage}`);
    }
  };

  const handlePreviousQuestion = () => {
    if (questionNumber > 1) {
      const prevQuestionNumber = questionNumber - 1;
      router.push(`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=${prevQuestionNumber}`);
    } else {
      toast.error('これが最初の問題です。');
    }
  };

  const handleNextQuestion = () => {
    if (questionData && questionNumber < questionData.totalQuestions) {
      const nextQuestionNumber = questionNumber + 1;
      router.push(`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=${nextQuestionNumber}`);
    } else {
      toast.error('これが最後の問題です。');
    }
  };

  return (
    <div className="quiz-play-page">
      <Toaster position="top-center" />
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
          <button className="previous-question" onClick={handlePreviousQuestion} disabled={questionNumber <= 1}>
            前の問題へ
          </button>
          <button className="check-later" onClick={handleCheckLater}>
            {checkedLaterQuestions.includes(questionNumber)
              ? '「後で確認」を解除'
              : '後で確認する'}
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

