'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ReferenceBook } from '@/types';

interface QuizResultItem {
  questionNumber: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

const mockResults: QuizResultItem[] = [
  {
    questionNumber: 1,
    question: '日本の首都はどこですか？',
    userAnswer: '東京',
    correctAnswer: '東京',
    isCorrect: true,
    explanation: '日本の首都は東京です。1868年に江戸から東京に改名されました。'
  },
  {
    questionNumber: 2,
    question: '2 + 2 = ?',
    userAnswer: '5',
    correctAnswer: '4',
    isCorrect: false,
    explanation: '2 + 2 = 4です。基本的な足し算の問題です。'
  },
  {
    questionNumber: 3,
    question: '地球の衛星の名前は何ですか？',
    userAnswer: '月',
    correctAnswer: '月',
    isCorrect: true,
    explanation: '地球の唯一の自然衛星は月です。'
  }
];

const mockReferenceBooks: ReferenceBook[] = [
  {
    id: '1',
    title: '基礎から学ぶ日本史',
    url: 'https://www.amazon.co.jp/dp/example1',
    description: '日本の歴史を基礎から学べる参考書'
  },
  {
    id: '2',
    title: '数学の基本問題集',
    url: 'https://www.amazon.co.jp/dp/example2',
    description: '基本的な数学問題を網羅した問題集'
  },
  {
    id: '3',
    title: '理科の基礎知識',
    url: 'https://www.amazon.co.jp/dp/example3',
    description: '理科の基礎知識をまとめた参考書'
  }
];

export default function QuizResultPage() {
  const [results] = useState<QuizResultItem[]>(mockResults);
  const [referenceBooks, setReferenceBooks] = useState<ReferenceBook[]>([]);
  const router = useRouter();

  const correctCount = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;
  const score = Math.round((correctCount / totalQuestions) * 100);

  useEffect(() => {
    const randomBooks = mockReferenceBooks
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    setReferenceBooks(randomBooks);
  }, []);

  const handleRecordScore = () => {
    alert('スコアを記録しました！');
    router.push('/score-history');
  };

  const handleBackToList = () => {
    router.push('/quiz-list');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">クイズ結果</h1>

        <Card className="mb-6" title="スコア">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{score}点</div>
            <div className="text-gray-600">
              {correctCount} / {totalQuestions} 問正解
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="詳細結果">
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.questionNumber}
                className={`p-4 rounded border-l-4 ${
                  result.isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">
                    問題{result.questionNumber}: {result.question}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      result.isCorrect
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {result.isCorrect ? '正解' : '不正解'}
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">あなたの回答:</span> {result.userAnswer}
                  </div>
                  <div>
                    <span className="font-medium">正解:</span> {result.correctAnswer}
                  </div>
                  <div className="mt-2 p-2 bg-white rounded text-gray-700">
                    <span className="font-medium">解説:</span> {result.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="参考書籍" className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            学習に役立つ参考書籍をランダムに表示しています。
          </p>
          <div className="space-y-3">
            {referenceBooks.map((book) => (
              <div key={book.id} className="p-3 border rounded hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-blue-600">{book.title}</h4>
                    <p className="text-sm text-gray-600">{book.description}</p>
                  </div>
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    詳細を見る
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-between">
          <Button onClick={handleBackToList} variant="secondary">
            クイズ一覧に戻る
          </Button>
          <Button onClick={handleRecordScore} variant="success">
            スコアを記録
          </Button>
        </div>
      </div>
    </div>
  );
}
