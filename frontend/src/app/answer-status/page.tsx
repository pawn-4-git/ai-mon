'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface QuestionStatus {
  id: string;
  questionNumber: number;
  text: string;
  status: 'answered' | 'unanswered' | 'marked';
}

const mockQuestionStatuses: QuestionStatus[] = [
  {
    id: '1',
    questionNumber: 1,
    text: '日本の首都はどこですか？',
    status: 'answered'
  },
  {
    id: '2',
    questionNumber: 2,
    text: '2 + 2 = ?',
    status: 'unanswered'
  },
  {
    id: '3',
    questionNumber: 3,
    text: '地球の衛星の名前は何ですか？',
    status: 'marked'
  }
];

export default function AnswerStatusPage() {
  const [questionStatuses] = useState<QuestionStatus[]>(mockQuestionStatuses);
  const router = useRouter();

  const getStatusBadge = (status: QuestionStatus['status']) => {
    switch (status) {
      case 'answered':
        return <span className="status-badge status-completed">回答済み</span>;
      case 'unanswered':
        return <span className="status-badge status-not-taken">未回答</span>;
      case 'marked':
        return <span className="status-badge status-updated">後で確認</span>;
      default:
        return null;
    }
  };

  const getStatusCounts = () => {
    const answered = questionStatuses.filter(q => q.status === 'answered').length;
    const unanswered = questionStatuses.filter(q => q.status === 'unanswered').length;
    const marked = questionStatuses.filter(q => q.status === 'marked').length;
    
    return { answered, unanswered, marked };
  };

  const { answered, unanswered, marked } = getStatusCounts();

  const handleBackToQuiz = () => {
    router.push('/quiz-play');
  };

  const handleFinishQuiz = () => {
    router.push('/quiz-result');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">回答状況確認</h1>

        <Card className="mb-6" title="回答状況サマリー">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{answered}</div>
              <div className="text-sm text-green-600">回答済み</div>
            </div>
            <div className="p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{unanswered}</div>
              <div className="text-sm text-red-600">未回答</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{marked}</div>
              <div className="text-sm text-yellow-600">後で確認</div>
            </div>
          </div>
        </Card>

        <Card title="問題一覧">
          <div className="space-y-3">
            {questionStatuses.map((question) => (
              <div key={question.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-600">
                    問題{question.questionNumber}
                  </span>
                  <span className="text-gray-800">{question.text}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(question.status)}
                  <Link href={`/quiz-play?question=${question.questionNumber}`}>
                    <Button variant="primary" size="sm">
                      問題へ移動
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-between mt-6">
          <Button onClick={handleBackToQuiz} variant="secondary">
            クイズに戻る
          </Button>
          <Button onClick={handleFinishQuiz} variant="danger">
            テスト終了
          </Button>
        </div>
      </div>
    </div>
  );
}
