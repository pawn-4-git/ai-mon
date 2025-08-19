'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
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

interface Answer {
  questionText: string;
  choices: string[];
  userChoice: string | null;
  afterCheck?: boolean;
  questionNumber: number; // 0-indexed
}

interface QuestionData {
  totalQuestions: number;
  questionText: string;
  choices: string[];
  userChoice: string | null;
  groupName: string;
  checkedLaterQuestions?: number[];
  afterCheck?: boolean;
  expiresAt: string; // APIからの有効期限
  answers?: Answer[];
  questionNumber?: number;
}

function QuizPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [isAfterChecked, setIsAfterChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

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

      const cacheKey = `quizCache_${quizSessionId}`;
      try {
        const cachedDataString = sessionStorage.getItem(cacheKey);
        const cachedAnswers = cachedDataString ? JSON.parse(cachedDataString) : {};
        
        let cachedQuestionData = null;
        for (const key in cachedAnswers) {
          if (cachedAnswers[key].questionNumber === questionNumber - 1) {
            cachedQuestionData = cachedAnswers[key];
            break;
          }
        }

        if (cachedQuestionData) {
          setQuestionData(cachedQuestionData);
          setSelectedChoice(cachedQuestionData.userChoice);
          setIsAfterChecked(cachedQuestionData.afterCheck === true);
          setLoading(false);
          return;
        }

        const data = await window.apiClient.get(`/Prod/results/${quizSessionId}?questionNumber=${questionNumber}`) as QuestionData;
        setQuestionData(data);
        setSelectedChoice(data.userChoice);
        setIsAfterChecked(data.afterCheck === true);

        if (data.answers) {
          const newCachedAnswers = { ...cachedAnswers };
          data.answers.forEach((answer: Answer) => {
            const questionDataForCache = {
              totalQuestions: data.totalQuestions,
              groupName: data.groupName,
              expiresAt: data.expiresAt,
              checkedLaterQuestions: data.checkedLaterQuestions,
              questionText: answer.questionText,
              choices: answer.choices,
              userChoice: answer.userChoice,
              afterCheck: answer.afterCheck,
              questionNumber: answer.questionNumber,
            };
            newCachedAnswers[answer.questionNumber] = questionDataForCache;
          });
          sessionStorage.setItem(cacheKey, JSON.stringify(newCachedAnswers));
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

  const submitAnswerIfNeeded = useCallback(async (): Promise<boolean> => {
    if (!selectedChoice || !quizSessionId || !window.apiClient) {
      return true;
    }

    try {
      await window.apiClient.post(`/Prod/quizzes/${quizSessionId}/answers`, {
        questionNumber: questionNumber,
        userAnswer: selectedChoice,
      });
      console.log(`Answer for question ${questionNumber} submitted successfully!`);

      const cacheKey = `quizCache_${quizSessionId}`;
      const cachedDataString = sessionStorage.getItem(cacheKey);
      if (cachedDataString) {
        const cachedAnswers = JSON.parse(cachedDataString);
        let itemKeyToUpdate = null;
        for (const key in cachedAnswers) {
          if (cachedAnswers[key].questionNumber === questionNumber - 1) {
            itemKeyToUpdate = key;
            break;
          }
        }

        if (itemKeyToUpdate) {
          cachedAnswers[itemKeyToUpdate].userChoice = selectedChoice;
          sessionStorage.setItem(cacheKey, JSON.stringify(cachedAnswers));
        }
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`問題${questionNumber}の回答送信に失敗しました: ${errorMessage}`);
      return false;
    }
  }, [quizSessionId, questionNumber, selectedChoice]);

  const handleFinishTest = useCallback(async (autoSubmit = false) => {
    if (!quizSessionId || !window.apiClient) {
      setError('Quiz Session ID or API client is not available.');
      return;
    }

    if (!autoSubmit && !confirm('テ��トを本当に終了しますか？')) {
      return;
    }

    const submissionSuccess = await submitAnswerIfNeeded();
    if (!submissionSuccess) {
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
  }, [quizSessionId, router, submitAnswerIfNeeded]);

  // Timer effect - recalculates from expiry time to prevent drift
  useEffect(() => {
    if (!questionData?.expiresAt) {
      return;
    }

    const expiryTime = new Date(questionData.expiresAt).getTime();

    const updateRemainingTime = () => {
      const now = new Date().getTime();
      const timeLeft = Math.round((expiryTime - now) / 1000);
      setRemainingTime(timeLeft > 0 ? timeLeft : 0);
    };

    // Set time immediately and then every second
    updateRemainingTime();
    const timerId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(timerId);
  }, [questionData?.expiresAt]);

  // Effect for when time runs out
  useEffect(() => {
    if (remainingTime === 0) {
      toast.error("時間切れです。テストを終了します。");
      handleFinishTest(true); // auto-submit
    }
  }, [remainingTime, handleFinishTest]);


  const handleSelectChoice = (choice: string) => {
    setSelectedChoice(choice);
  };

  const handleCheckLater = async () => {
    if (!quizSessionId || !window.apiClient || !questionData) {
      setError('Quiz Session ID, API client, or question data is not available.');
      return;
    }

    const afterCheckValue = !isAfterChecked;
    let updatedLaterQuestions;

    const currentCheckedLater = questionData.checkedLaterQuestions || [];

    if (afterCheckValue) {
      // Add to list if not present
      if (!currentCheckedLater.includes(questionNumber)) {
        updatedLaterQuestions = [...currentCheckedLater, questionNumber].sort((a, b) => a - b);
      } else {
        updatedLaterQuestions = currentCheckedLater;
      }
    } else {
      // Remove from list
      updatedLaterQuestions = currentCheckedLater.filter(
        (qNum) => qNum !== questionNumber
      );
    }

    try {
      await window.apiClient.post(`/Prod/quizzes/user-answer`, {
        scoreId: quizSessionId,
        questionNumber: questionNumber,
        checkedLaterQuestions: updatedLaterQuestions,
        afterCheckValue: afterCheckValue,
      });

      // Update state after successful API call
      setIsAfterChecked(afterCheckValue);
      const newQuestionData = { ...questionData, checkedLaterQuestions: updatedLaterQuestions, afterCheck: afterCheckValue };
      setQuestionData(newQuestionData);

      const cacheKey = `quizCache_${quizSessionId}`;
      const cachedDataString = sessionStorage.getItem(cacheKey);
      if (cachedDataString) {
        const cachedAnswers = JSON.parse(cachedDataString);
        let itemKeyToUpdate = null;
        for (const key in cachedAnswers) {
          if (cachedAnswers[key].questionNumber === questionNumber - 1) {
            itemKeyToUpdate = key;
            break;
          }
        }

        if (itemKeyToUpdate) {
          cachedAnswers[itemKeyToUpdate].afterCheck = afterCheckValue;
          Object.keys(cachedAnswers).forEach(key => {
            cachedAnswers[key].checkedLaterQuestions = updatedLaterQuestions;
          });
          sessionStorage.setItem(cacheKey, JSON.stringify(cachedAnswers));
        }
      }

      if (afterCheckValue) {
        toast.success(`問題${questionNumber}を「後で確認する」に設定しました。`);
      } else {
        toast.success(`問題${questionNumber}の「後で確認する」を解除しました。`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`更新に失敗しました: ${errorMessage}`);
      setError(`Failed to update check later status: ${errorMessage}`);
    }
  };

  const handlePreviousQuestion = async () => {
    const submissionSuccess = await submitAnswerIfNeeded();
    if (!submissionSuccess) {
      return;
    }
    if (questionNumber > 1) {
      const prevQuestionNumber = questionNumber - 1;
      router.push(`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=${prevQuestionNumber}`);
    } else {
      toast.error('これが最初の問題です。');
    }
  };

  const handleNextQuestion = async () => {
    const submissionSuccess = await submitAnswerIfNeeded();
    if (!submissionSuccess) {
      return;
    }
    if (questionData && questionNumber < questionData.totalQuestions) {
      const nextQuestionNumber = questionNumber + 1;
      router.push(`/quiz-play?quizSessionId=${quizSessionId}&questionNumber=${nextQuestionNumber}`);
    } else {
      toast.error('これが最後の問題です。');
    }
  };

  const handleCheckAnswerStatus = async () => {
    const submissionSuccess = await submitAnswerIfNeeded();
    if (!submissionSuccess) {
      return;
    }
    router.push(`/answer-status?quizSessionId=${quizSessionId}&questionNumber=${questionNumber}`);
  };

  const formatTime = (timeInSeconds: number | null) => {
    if (timeInSeconds === null) return '...';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
            <p>残り時間: <span id="remaining-time">{formatTime(remainingTime)}</span></p>
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
            {isAfterChecked ? '「後で確認」を解除' : '後で確認する'}
          </button>
          <button onClick={handleNextQuestion}>
            次の問題へ
          </button>
          <button onClick={handleCheckAnswerStatus}>
            解答状況を確認
          </button>
          <button onClick={() => handleFinishTest(false)}>
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


