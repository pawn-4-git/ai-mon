'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { QuizGroup } from '@/types';

const mockQuizGroups: QuizGroup[] = [
  {
    id: '1',
    name: '数学基礎',
    status: 'not-taken',
    questionCount: 10,
    timeLimit: 15
  },
  {
    id: '2',
    name: '歴史問題',
    status: 'updated',
    questionCount: 15,
    timeLimit: 20,
    lastScore: 85
  },
  {
    id: '3',
    name: '科学知識',
    status: 'completed',
    questionCount: 12,
    timeLimit: 18,
    lastScore: 92,
    lastTaken: new Date('2024-01-15')
  }
];

export default function QuizListPage() {
  const [quizGroups] = useState<QuizGroup[]>(mockQuizGroups);

  const getStatusBadge = (status: QuizGroup['status']) => {
    switch (status) {
      case 'not-taken':
        return <span className="status-badge status-not-taken">未受験</span>;
      case 'updated':
        return <span className="status-badge status-updated">更新あり</span>;
      case 'completed':
        return <span className="status-badge status-completed">受験済み</span>;
      default:
        return null;
    }
  };

  const getActionButton = (group: QuizGroup) => {
    if (group.status === 'not-taken') {
      return (
        <Link href={`/quiz-play?groupId=${group.id}`}>
          <Button variant="primary">テスト開始</Button>
        </Link>
      );
    } else {
      return (
        <div className="flex space-x-2">
          <Link href={`/quiz-play?groupId=${group.id}`}>
            <Button variant="primary">再受験</Button>
          </Link>
          <Link href={`/create-quiz?groupId=${group.id}`}>
            <Button variant="secondary">編集</Button>
          </Link>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">クイズ一覧</h1>
          <Link href="/create-quiz">
            <Button variant="success">新しいクイズを作成</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {quizGroups.map((group) => (
            <div key={group.id} className="quiz-item">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    {getStatusBadge(group.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>問題数: {group.questionCount}問</p>
                    <p>制限時間: {group.timeLimit}分</p>
                    {group.lastScore && (
                      <p>前回スコア: {group.lastScore}点</p>
                    )}
                    {group.lastTaken && (
                      <p>最終受験日: {group.lastTaken.toLocaleDateString('ja-JP')}</p>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  {getActionButton(group)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {quizGroups.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-500 mb-4">まだクイズが作成されていません。</p>
            <Link href="/create-quiz">
              <Button variant="primary">最初のクイズを作成する</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
