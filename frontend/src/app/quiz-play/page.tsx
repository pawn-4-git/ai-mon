'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Question } from '@/types';

const mockQuestions: Question[] = [
  {
    id: '1',
    text: '日本の首都はどこですか？',
    choices: ['大阪', '東京', '京都', '名古屋'],
    correctAnswer: 1,
    explanation: '日本の首都は東京です。1868年に江戸から東京に改名されました。'
  },
  {
    id: '2',
    text: '2 + 2 = ?',
    choices: ['3', '4', '5', '6'],
    correctAnswer: 1,
    explanation: '2 + 2 = 4です。基本的な足し算の問題です。'
  },
  {
    id: '3',
    text: '地球の衛星の名前は何ですか？',
    choices: ['太陽', '月', '火星', '金星'],
    correctAnswer: 1,
    explanation: '地球の唯一の自然衛星は月です。'
  }
];

export default function QuizPlayPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: number | null }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [key: string]: boolean }>({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const router = useRouter();

  const currentQuestion = mockQuestions[currentQuestionIndex];

  const handleFinishQuiz = useCallback(() => {
    router.push('/quiz-result');
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleFinishQuiz]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setAnswers({
      ...answers,
      [currentQuestion.id]: answerIndex
    });
  };

  const handleMarkForReview = () => {
    setMarkedForReview({
      ...markedForReview,
      [currentQuestion.id]: !markedForReview[currentQuestion.id]
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[mockQuestions[currentQuestionIndex + 1].id] || null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[mockQuestions[currentQuestionIndex - 1].id] || null);
    }
  };

  const handleAnswerStatus = () => {
    router.push('/answer-status');
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">クイズ受験</h1>
          <div className="timer">
            残り時間: {formatTime(timeRemaining)}
          </div>
        </div>

        <Card>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                問題 {currentQuestionIndex + 1} / {mockQuestions.length}
              </span>
              <button
                onClick={handleMarkForReview}
                className={`px-3 py-1 text-sm rounded ${
                  markedForReview[currentQuestion.id]
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {markedForReview[currentQuestion.id] ? '確認済み' : '後で確認する'}
              </button>
            </div>
            <h2 className="text-lg font-semibold mb-4">{currentQuestion.text}</h2>
          </div>

          <div className="space-y-3 mb-6">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`choice-button ${selectedAnswer === index ? 'selected' : ''}`}
              >
                {index + 1}. {choice}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="secondary"
              >
                前の問題
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === mockQuestions.length - 1}
                variant="primary"
              >
                次の問題
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAnswerStatus} variant="warning">
                回答状況確認
              </Button>
              <Button onClick={handleFinishQuiz} variant="danger">
                テスト終了
              </Button>
            </div>
          </div>
        </Card>

        <Card className="mt-4" title="進捗状況">
          <div className="grid grid-cols-10 gap-2">
            {mockQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentQuestionIndex(index);
                  setSelectedAnswer(answers[mockQuestions[index].id] || null);
                }}
                className={`w-8 h-8 text-sm rounded ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[mockQuestions[index].id] !== undefined
                    ? 'bg-green-200 text-green-800'
                    : markedForReview[mockQuestions[index].id]
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
